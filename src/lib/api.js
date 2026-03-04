import { supabase } from './supabase';

const TIMEOUT_MS = 10000;
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const withTimeout = (promise) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Request timed out after 10 seconds'));
        }, TIMEOUT_MS);

        promise
            .then((res) => {
                clearTimeout(timer);
                resolve(res);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
};

const getAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const token = data?.session?.access_token;
    if (!token) {
        throw new Error('Sign in required.');
    }
    return token;
};

export const getCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user || null;
};

/**
 * Fetch all published countries.
 * Replaces: GET /public/countries
 */
export const fetchCountries = async () => {
    const { data: countryRows, error: countriesError } = await withTimeout(
        supabase
            .from('country_profile_compact')
            .select(`
            id,
            name,
            iso2,
            regions,
            last_verified_at,
            lgbtq_rights_index,
            abortion_access_status,
            abortion_access_tier,
            status
        `)
            .in('status', ['published', 'verified'])
    );

    if (countriesError) {
        console.error('Error fetching countries:', countriesError);
        throw countriesError;
    }

    const countryIds = (countryRows || []).map((row) => row.id).filter(Boolean);
    if (!countryIds.length) return [];

    const { data: pathRows, error: pathsError } = await withTimeout(
        supabase
            .from('visa_paths')
            .select(`
            country_id,
            name,
            type,
            description
        `)
            .in('country_id', countryIds)
            .eq('status', 'published')
    );

    if (pathsError) {
        console.error('Error fetching country pathways:', pathsError);
        throw pathsError;
    }

    const pathwaysByCountryId = new Map();
    (pathRows || []).forEach((row) => {
        if (!row?.country_id) return;
        if (!pathwaysByCountryId.has(row.country_id)) {
            pathwaysByCountryId.set(row.country_id, []);
        }
        pathwaysByCountryId.get(row.country_id).push({
            name: row.name,
            type: row.type,
            description: row.description
        });
    });

    return (countryRows || []).map((country) => {
        const pathways = pathwaysByCountryId.get(country.id) || [];
        const pathwayCount = pathways.length;
        const pathwayTypes = Array.from(new Set(pathways.map((pathway) => pathway.type).filter(Boolean)));

        return {
            ...country,
            pathway_count: pathwayCount,
            pathway_types: pathwayTypes
        };
    });
};

/**
 * Fetch a single country by ID.
 * Replaces: GET /public/countries/:id
 */
export const fetchCountryById = async (id) => {
    const { data, error } = await withTimeout(
        supabase
            .from('country_profile_compact')
            .select('*')
            .eq('id', id)
            .in('status', ['published', 'verified'])
            .single()
    );

    if (error) {
        console.error(`Error fetching country ${id}:`, error);
        throw error;
    }
    return data;
};

/**
 * Fetch sources for a country (from API).
 */
export const fetchCountrySources = async (id) => {
    if (!id) throw new Error('country id is required');
    const response = await withTimeout(fetch(`${API_BASE}/public/countries/${id}/sources`));
    if (!response.ok) {
        throw new Error(`Failed to fetch sources (${response.status})`);
    }
    return response.json();
};

/**
 * Fetch visa paths for a country.
 * Replaces: GET /public/visa-paths?country_id=...
 */
export const fetchVisaPaths = async (countryId) => {
    if (!countryId) throw new Error('country_id is required');

    const { data, error } = await withTimeout(
        supabase
            .from('visa_paths')
            .select(`
            id, 
            name, 
            type, 
            description, 
            last_verified_at
        `)
            .eq('country_id', countryId)
            .eq('status', 'published')
    );

    if (error) {
        console.error('Error fetching visa paths:', error);
        throw error;
    }
    return data;
};

/**
 * Fetch details of a specific visa path, including requirements and steps.
 * Replaces: GET /public/visa-paths/:id
 * Note: uses parallel queries instead of multiple joins for simplicity and speed.
 */
export const fetchVisaPathDetail = async (id) => {
    if (!id) throw new Error('Visa path id is required');

    // Parallelize the queries
    const [pathRes, reqRes, stepsRes] = await withTimeout(Promise.all([
        supabase.from('visa_paths').select('*').eq('id', id).eq('status', 'published').single(),
        supabase.from('requirements').select('*').eq('visapath_id', id),
        supabase.from('steps').select('*').eq('visapath_id', id).order('order_int')
    ]));

    if (pathRes.error) throw pathRes.error;
    if (reqRes.error) throw reqRes.error;
    if (stepsRes.error) throw stepsRes.error;

    return {
        ...pathRes.data,
        requirements: reqRes.data,
        steps: stepsRes.data
    };
};

export const fetchSaveContexts = async () => {
    const { data, error } = await withTimeout(
        supabase
            .from('user_save_contexts')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
    );

    if (error) throw error;
    return data || [];
};

export const createSaveContext = async ({ name, description = null }) => {
    const { data, error } = await withTimeout(
        supabase
            .from('user_save_contexts')
            .insert({ name, description })
            .select('*')
            .single()
    );

    if (error) throw error;
    return data;
};

export const fetchSavedPathsActive = async () => {
    const { data, error } = await withTimeout(
        supabase
            .from('v_user_saved_paths_active')
            .select('*')
            .order('created_at', { ascending: false })
    );

    if (error) throw error;
    return data || [];
};

export const createSavedPath = async ({ canonicalPathId, contextId = null, savedLabel = null }) => {
    const payload = {
        canonical_path_id: canonicalPathId,
        context_id: contextId || null,
        saved_label: savedLabel || null
    };

    const { data, error } = await withTimeout(
        supabase
            .from('user_saved_paths')
            .insert(payload)
            .select('*')
            .single()
    );

    if (error) throw error;
    return data;
};

export const assignSavedPathContext = async ({ savedPathId, contextId = null }) => {
    const { data, error } = await withTimeout(
        supabase
            .from('user_saved_paths')
            .update({ context_id: contextId || null })
            .eq('id', savedPathId)
            .is('deleted_at', null)
            .select('*')
            .single()
    );

    if (error) throw error;
    return data;
};

export const archiveSavedPath = async (savedPathId) => {
    const { error } = await withTimeout(
        supabase
            .from('user_saved_paths')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', savedPathId)
            .is('deleted_at', null)
    );

    if (error) throw error;
};

export const fetchSavedPathNotes = async (savedPathId) => {
    const token = await getAccessToken();
    const response = await withTimeout(
        fetch(`${API_BASE}/v1/saved-path-notes?saved_path_id=${encodeURIComponent(savedPathId)}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch notes (${response.status})`);
    }
    return response.json();
};

export const createSavedPathNote = async ({ savedPathId, title = null, body }) => {
    const token = await getAccessToken();
    const response = await withTimeout(
        fetch(`${API_BASE}/v1/saved-path-notes`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                saved_path_id: savedPathId,
                title: title || null,
                body
            })
        })
    );

    if (!response.ok) {
        throw new Error(`Failed to create note (${response.status})`);
    }
    return response.json();
};

export const updateSavedPathNote = async ({ noteId, title = null, body }) => {
    const token = await getAccessToken();
    const response = await withTimeout(
        fetch(`${API_BASE}/v1/saved-path-notes/${encodeURIComponent(noteId)}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title || null,
                body
            })
        })
    );

    if (!response.ok) {
        throw new Error(`Failed to update note (${response.status})`);
    }
    return response.json();
};

export const deleteSavedPathNote = async (noteId) => {
    const token = await getAccessToken();
    const response = await withTimeout(
        fetch(`${API_BASE}/v1/saved-path-notes/${encodeURIComponent(noteId)}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
    );

    if (!response.ok) {
        throw new Error(`Failed to delete note (${response.status})`);
    }
};

export const createPrivacyExport = async () => {
    const token = await getAccessToken();
    const response = await withTimeout(fetch(`${API_BASE}/v1/privacy/exports`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `export-${Date.now()}`
        },
        body: JSON.stringify({})
    }));

    if (!response.ok) {
        throw new Error(`Export request failed (${response.status})`);
    }
    return response.json();
};

export const createPrivacyDeletionRequest = async () => {
    const token = await getAccessToken();
    const response = await withTimeout(fetch(`${API_BASE}/v1/privacy/deletion-requests`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `delete-${Date.now()}`
        },
        body: JSON.stringify({})
    }));

    if (!response.ok) {
        throw new Error(`Deletion request failed (${response.status})`);
    }
    return response.json();
};

export const fetchChecklistTemplateByVisaPath = async (visaPathId) => {
    const { data, error } = await withTimeout(
        supabase
            .from('checklist_templates')
            .select('*')
            .eq('visa_path_id', visaPathId)
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
    );
    if (error) throw error;
    return data || null;
};

export const fetchChecklistTemplateById = async (templateId) => {
    const { data, error } = await withTimeout(
        supabase
            .from('checklist_templates')
            .select('*')
            .eq('id', templateId)
            .maybeSingle()
    );
    if (error) throw error;
    return data || null;
};

export const fetchChecklistTemplateItems = async (templateId) => {
    const { data, error } = await withTimeout(
        supabase
            .from('checklist_template_items')
            .select('*')
            .eq('template_id', templateId)
            .order('sort_order', { ascending: true })
    );
    if (error) throw error;
    return data || [];
};

export const fetchTemplateVersion = async (templateId) => {
    const { data, error } = await withTimeout(
        supabase
            .from('template_version_links')
            .select('*')
            .eq('template_id', templateId)
            .maybeSingle()
    );
    if (error) throw error;
    return data || null;
};

export const findOrCreateSavedPathForCanonical = async (canonicalPathId) => {
    const { data: existing, error: existingError } = await withTimeout(
        supabase
            .from('user_saved_paths')
            .select('*')
            .eq('canonical_path_id', canonicalPathId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
    );
    if (existingError) throw existingError;
    if (existing) return existing;

    const { data: created, error: createError } = await withTimeout(
        supabase
            .from('user_saved_paths')
            .insert({ canonical_path_id: canonicalPathId })
            .select('*')
            .single()
    );
    if (createError) throw createError;
    return created;
};

export const fetchLatestSavedPathByCanonical = async (canonicalPathId) => {
    const { data, error } = await withTimeout(
        supabase
            .from('user_saved_paths')
            .select('*')
            .eq('canonical_path_id', canonicalPathId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
    );
    if (error) throw error;
    return data || null;
};

export const fetchLatestChecklistForSavedPath = async (savedPathId) => {
    const { data, error } = await withTimeout(
        supabase
            .from('user_path_checklists')
            .select('*')
            .eq('saved_path_id', savedPathId)
            .is('archived_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
    );
    if (error) throw error;
    return data || null;
};

export const createLiveChecklist = async ({ savedPathId, templateId }) => {
    const { data: userData, error: userError } = await withTimeout(supabase.auth.getUser());
    if (userError) throw userError;
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Sign in required.');

    const { data: checklist, error: checklistError } = await withTimeout(
        supabase
            .from('user_path_checklists')
            .insert({
                saved_path_id: savedPathId,
                template_id: templateId,
                status: 'in_progress',
                started_at: new Date().toISOString()
            })
            .select('*')
            .single()
    );
    if (checklistError) throw checklistError;

    const templateItems = await fetchChecklistTemplateItems(templateId);
    if (templateItems.length > 0) {
        const rows = templateItems.map((item) => ({
            user_id: userId,
            user_path_checklist_id: checklist.id,
            template_item_id: item.id,
            status: 'incomplete'
        }));

        const { error: itemError } = await withTimeout(
            supabase
                .from('user_checklist_item_states')
                .upsert(rows, { onConflict: 'user_path_checklist_id,template_item_id' })
        );
        if (itemError) throw itemError;
    }

    return checklist;
};

export const fetchLiveChecklistItems = async (userPathChecklistId) => {
    const { data, error } = await withTimeout(
        supabase
            .from('v_user_checklist_items')
            .select('*')
            .eq('user_path_checklist_id', userPathChecklistId)
            .order('sort_order', { ascending: true })
    );
    if (error) throw error;
    return data || [];
};

export const updateLiveChecklistItem = async ({ itemStateId, status, notes }) => {
    const payload = {
        status,
        notes: notes ?? null,
        completed_at: status === 'completed' ? new Date().toISOString() : null
    };
    const { data, error } = await withTimeout(
        supabase
            .from('user_checklist_item_states')
            .update(payload)
            .eq('id', itemStateId)
            .select('*')
            .single()
    );
    if (error) throw error;
    return data;
};

export const archiveChecklist = async (checklistId) => {
    const { data, error } = await withTimeout(
        supabase
            .from('user_path_checklists')
            .update({
                status: 'archived',
                archived_at: new Date().toISOString()
            })
            .eq('id', checklistId)
            .select('*')
            .single()
    );
    if (error) throw error;
    return data;
};
