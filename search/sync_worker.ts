// search/sync_worker.ts
import { supabase } from '../workers/supabase_client.ts'
import { Client as TypesenseClient } from 'typesense'

const typesenseClient = new TypesenseClient({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.TYPESENSE_PORT || '8108', 10),
      protocol: process.env.TYPESENSE_PROTOCOL || 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
})

interface SyncTask {
  entityType: 'countries' | 'visa_paths'
  entityId: string
}

const TYPESENSE_MAX_DOC_BYTES = 2 * 1024 * 1024
const SAFE_DOC_BYTES = Math.floor(TYPESENSE_MAX_DOC_BYTES * 0.95)
const MAX_CONTENT_BYTES = 180_000

const toTimestamp = (value?: string | null): number =>
  value ? new Date(value).getTime() : 0

const transformDocument = (
  data: any,
  entityType: 'countries' | 'visa_paths'
): Record<string, any> | null => {
  const base = {
    id: data.id,
    name: data.name,
    last_verified_at: toTimestamp(data.last_verified_at),
    search_version: 1,
    tags: [] as string[],
  }

  if (entityType === 'countries') {
    return {
      ...base,
      iso2: data.iso2,
      regions: data.regions ?? [],
      languages: data.languages ?? [],
      currency: data.currency ?? null,
      climate_tags: data.climate_tags ?? [],
      timezones: data.timezones ?? [],
      lgbtq_rights_index: data.lgbtq_rights_index ?? null,
      abortion_access_status: data.abortion_access_status ?? null,
      abortion_access_tier: data.abortion_access_tier ?? null,
      content: [
        data.healthcare_overview,
        data.rights_snapshot,
        data.tax_snapshot,
      ]
        .filter(Boolean)
        .join(' '),
      tags: [...(data.regions ?? []), ...(data.climate_tags ?? [])],
    }
  }

  if (entityType === 'visa_paths') {
    const eligibilityArr = Array.isArray(data.eligibility)
      ? data.eligibility
      : []

    const feesArr = Array.isArray(data.fees) ? data.fees : []

    const feesText = feesArr
      .map((f: any) =>
        f?.amount && f?.currency ? `${f.amount} ${f.currency}` : null
      )
      .filter(Boolean)
      .join(', ')

    return {
      ...base,
      country_id: data.country_id,
      country_name: data.country?.name ?? 'Unknown',
      type: data.type,
      description: data.description ?? null,
      work_rights: data.work_rights ?? null,
      in_country_conversion_path: data.in_country_conversion_path ?? null,
      dependents_rules: data.dependents_rules ?? null,
      renewal_rules: data.renewal_rules ?? null,
      to_pr_citizenship_timeline: data.to_pr_citizenship_timeline ?? null,
      min_income_amount: data.min_income_amount ?? null,
      min_income_currency: data.min_income_currency ?? null,
      min_savings_amount: data.min_savings_amount ?? null,
      min_savings_currency: data.min_savings_currency ?? null,
      eligibility_terms: eligibilityArr,
      content: [
        data.description,
        eligibilityArr.join('; '),
        data.work_rights,
        data.dependents_rules,
        feesText,
      ]
        .filter(Boolean)
        .join(' '),
      tags: [data.type, data.country?.name].filter(Boolean),
    }
  }

  return null
}

export const handler = async (task: SyncTask) => {
  const { entityType, entityId } = task
  const collectionName = entityType

  const source =
    entityType === 'countries'
      ? 'country_profile_compact'
      : 'visa_paths'

  const select =
    entityType === 'visa_paths'
      ? '*, country:countries(name)'
      : '*'

  const { data, error } = await supabase
    .from(source)
    .select(select)
    .eq('id', entityId)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    try {
      await typesenseClient
        .collections(collectionName)
        .documents(entityId)
        .delete()
    } catch (err) {
      console.error(`[search-sync] Failed to delete ${collectionName}:${entityId}`, err)
    }
    return
  }

  const document = transformDocument(data, entityType)
  if (!document) return
  try {
    constrainDocumentSize(document, `${collectionName}:${entityId}`)
  } catch (err) {
    console.error(String(err))
    return
  }

  try {
    await typesenseClient
      .collections(collectionName)
      .documents()
      .upsert(document)
  } catch (err) {
    console.error(`[search-sync] Failed to upsert ${collectionName}:${entityId}`, err)
  }
}

function constrainDocumentSize(document: Record<string, any>, documentId: string): void {
  if (getDocBytes(document) <= SAFE_DOC_BYTES) {
    return
  }

  if (typeof document.content === 'string' && document.content.length > 0) {
    document.content = truncateToBytes(document.content, MAX_CONTENT_BYTES)
  }

  if (typeof document.description === 'string' && document.description.length > 0) {
    document.description = truncateToBytes(document.description, Math.floor(MAX_CONTENT_BYTES / 2))
  }

  if (Array.isArray(document.eligibility_terms)) {
    document.eligibility_terms = document.eligibility_terms
      .map((value: unknown) => (typeof value === 'string' ? truncateToBytes(value, 2_000) : value))
      .slice(0, 200)
  }

  const finalSize = getDocBytes(document)
  if (finalSize > TYPESENSE_MAX_DOC_BYTES) {
    throw new Error(
      `[search-sync] Document exceeds Typesense 2MB limit after truncation for ${documentId}: ${finalSize} bytes`
    )
  }
}

function getDocBytes(document: Record<string, unknown>): number {
  return Buffer.byteLength(JSON.stringify(document), 'utf8')
}

function truncateToBytes(value: string, maxBytes: number): string {
  if (Buffer.byteLength(value, 'utf8') <= maxBytes) {
    return value
  }

  let truncated = value
  while (truncated.length > 0 && Buffer.byteLength(truncated, 'utf8') > maxBytes) {
    truncated = truncated.slice(0, Math.floor(truncated.length * 0.8))
  }
  return truncated
}
