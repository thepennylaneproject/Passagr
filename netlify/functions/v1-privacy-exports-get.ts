/**
 * GET /v1/privacy/exports/:job_id
 * Get the status of a data export job
 */

import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import {
  extractToken,
  getUserClient,
  verifySupabaseUser,
  ErrorResponse,
} from './_shared';

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' } as ErrorResponse),
    };
  }

  try {
    // Verify user authentication
    const userId = await verifySupabaseUser(event);
    const token = extractToken(event);

    // Extract job_id from path
    const jobId = event.path.split('/').pop();
    
    if (!jobId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing job_id in path' } as ErrorResponse),
      };
    }

    // Query export job with user client (RLS enforces user_id match)
    const supabase = getUserClient(token);
    const { data, error } = await supabase
      .from('export_jobs')
      .select('id, status')
      .eq('id', jobId)
      .single();

    if (error) {
      // Check if it's a not found error
      if (error.code === 'PGRST116' || error.message.includes('no rows')) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: 'Export job not found',
            details: 'Job does not exist or does not belong to you',
          } as ErrorResponse),
        };
      }

      console.error('Failed to fetch export job:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to fetch export job',
          // A-7: error detail logged server-side only
        } as ErrorResponse),
      };
    }

    if (!data) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Export job not found',
          details: 'Job does not exist or does not belong to you',
        } as ErrorResponse),
      };
    }

    const response = {
      job_id: data.id,
      status: data.status,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    const error = err as Error;
    console.error('Export fetch error:', error);

    // Handle authentication errors
    if (error.message.includes('Authorization') || error.message.includes('token')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authentication required' } as ErrorResponse),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        // A-7: error detail logged server-side only
      } as ErrorResponse),
    };
  }
};
