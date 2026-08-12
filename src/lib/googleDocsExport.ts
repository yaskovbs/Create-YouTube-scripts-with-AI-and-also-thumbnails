import { GeneratedResult } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Formats script into Google Docs Document structure
 */
export async function createGoogleDocFromScript(
  result: GeneratedResult,
  accessToken?: string
): Promise<{ docUrl: string; docId: string }> {
  let token = accessToken || localStorage.getItem('gdocs_access_token');

  // Request OAuth Token via Google GSI client if not available
  if (!token) {
    token = await requestAccessToken();
  }

  if (!token) {
    throw new Error('לא התקבל אישור גישה ל-Google Docs. אנא אשר את החיבור ונסה שוב.');
  }

  // 1. Create blank Google Document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: result.mainTitle,
    }),
  });

  if (!createRes.ok) {
    const errJson = await createRes.json().catch(() => ({}));
    if (createRes.status === 401) {
      localStorage.removeItem('gdocs_access_token');
      // Retry once
      const newToken = await requestAccessToken();
      return createGoogleDocFromScript(result, newToken);
    }
    throw new Error(errJson.error?.message || 'שגיאה ביצירת מסמך ב-Google Docs');
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;

  // 2. Build Text content for the document
  let docText = `תסריט יוטיוב: ${result.mainTitle}\n\n`;
  docText += `זמן הקראה משוער: כ-140 מילים בדקה\n`;
  docText += `תאריך יצירה: ${new Date(result.generatedAt).toLocaleString('he-IL')}\n\n`;

  docText += `----------------------------------------------------\n`;
  docText += `[HOOK - 10 שניות ראשונות]\n${result.hookText}\n\n`;

  docText += `[INTRO - הקדמה]\n${result.introText}\n\n`;

  docText += `====================================================\n`;
  docText += `פרקי התסריט (${result.chapters.length})\n`;
  docText += `====================================================\n\n`;

  result.chapters.forEach((c, idx) => {
    docText += `פרק ${idx + 1} [${c.timestamp}] - ${c.title}\n`;
    docText += `תמצית: ${c.summary}\n`;
    docText += `טקסט דיבור:\n${c.scriptText}\n`;
    if (c.visualCue) {
      docText += `[B-Roll / ויזואל: ${c.visualCue}]\n`;
    }
    docText += `----------------------------------------------------\n\n`;
  });

  docText += `[CALL TO ACTION - הנעה לפעולה]\n${result.ctaText}\n\n`;

  docText += `====================================================\n`;
  docText += `תיאור מוכן ל-YOUTUBE\n`;
  docText += `====================================================\n`;
  docText += `${result.youtubeDescription}\n\n`;

  if (result.hashtags && result.hashtags.length > 0) {
    docText += `האשטגים: ${result.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}\n\n`;
  }

  if (result.seoTags && result.seoTags.length > 0) {
    docText += `תגיות SEO מומלצות: ${result.seoTags
      .map((t) => (typeof t === 'string' ? t : t.tag))
      .join(', ')}\n`;
  }

  // 3. Batch Update Document Content
  const updateRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: docText,
            },
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Doc content insertion warned, document created successfully');
  }

  const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;
  return { docUrl, docId: documentId };
}

/**
 * Request Access Token using Google Identity Services (GSI)
 */
export function requestAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      // Fallback: prompt for user token or throw error
      const manualToken = prompt('אנא הזן Google Access Token לשמירה ב-Docs (או השתמש בלחצן ההרשאות):');
      if (manualToken) {
        localStorage.setItem('gdocs_access_token', manualToken);
        return resolve(manualToken);
      }
      return reject(
        new Error(
          'ספריית Google OAuth אינה זמינה בדפדפן. אנא ודא שהתחברת ל-Google.'
        )
      );
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: '', // Will use default authorization or prompt
      scope:
        'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(`OAuth Error: ${response.error_description || response.error}`));
        } else if (response.access_token) {
          localStorage.setItem('gdocs_access_token', response.access_token);
          resolve(response.access_token);
        } else {
          reject(new Error('לא התקבל Access Token מ-Google'));
        }
      },
      error_callback: (err: any) => {
        reject(new Error(err.message || 'שגיאה באישור הרשאות Google'));
      },
    });

    client.requestAccessToken();
  });
}
