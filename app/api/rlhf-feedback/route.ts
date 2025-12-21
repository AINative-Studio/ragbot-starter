import { NextRequest, NextResponse } from 'next/server';
import nodeFetch from 'node-fetch';

const ZERODB_API_URL = process.env.ZERODB_API_URL!;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID!;
const ZERODB_EMAIL = process.env.ZERODB_EMAIL!;
const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD!;

// Get JWT token from ZeroDB using node-fetch to avoid DNS issues
async function getAuthToken(): Promise<string> {
  const response = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { rating, messageContent, messageId, timestamp } = await req.json();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    console.log('📊 Collecting RLHF feedback:', {
      rating,
      messageId,
      contentLength: messageContent?.length || 0
    });

    // Authenticate with ZeroDB
    console.log('🔐 Authenticating with ZeroDB for RLHF...');
    const token = await getAuthToken();
    console.log('✅ ZeroDB authentication successful');

    // Send RLHF feedback to ZeroDB using the correct endpoint with node-fetch
    console.log('📤 Sending RLHF feedback to ZeroDB...');
    const rlhfResponse = await nodeFetch(`${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/database/rlhf/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'user_feedback',
        prompt: messageContent.substring(0, 500), // Truncate if too long
        response: messageContent,
        rating: rating,
        metadata: {
          message_id: messageId,
          timestamp: timestamp,
          rating_type: 'star_rating',
          agent_id: 'spiritual-wisdom-chatbot'
        }
      })
    });

    if (!rlhfResponse.ok) {
      const errorText = await rlhfResponse.text();
      console.error(`❌ ZeroDB RLHF API failed: ${rlhfResponse.status} - ${errorText}`);
      throw new Error(`RLHF API error: ${rlhfResponse.status}`);
    }

    const rlhfData = await rlhfResponse.json() as any;
    console.log('✅ RLHF feedback sent successfully:', rlhfData);

    return NextResponse.json({
      success: true,
      message: 'Feedback collected successfully',
      data: rlhfData
    });

  } catch (error: any) {
    console.error('❌ RLHF feedback collection failed:', error.message);
    return NextResponse.json(
      { error: 'Failed to collect feedback', details: error.message },
      { status: 500 }
    );
  }
}
