import { GeneratedResult } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Dynamically loads the Google Identity Services (GSI) script if not already present
 */
export function ensureGsiScriptLoaded(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      return resolve(true);
    }

    const existingScript = document.getElementById('gsi-client-script');
    if (existingScript) {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts > 20) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 150);
      return;
    }

    const script = document.createElement('script');
    script.id = 'gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts > 15) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Builds formatted text representation of the script
 */
export function buildFormattedDocText(result: GeneratedResult): string {
  let docText = `====================================================\n`;
  docText += `תסריט יוטיוב: ${result.mainTitle}\n`;
  docText += `====================================================\n\n`;
  docText += `נוצר ב: ${new Date(result.generatedAt).toLocaleString('he-IL')}\n`;
  if (result.deadline) {
    docText += `תאריך יעד לפרסום: ${new Date(result.deadline).toLocaleString('he-IL')}\n`;
  }
  docText += `\n`;

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

  return docText;
}

/**
 * Formats script into Google Docs Document structure with automatic API & 1-click Fallback
 */
export async function createGoogleDocFromScript(
  result: GeneratedResult,
  accessToken?: string
): Promise<{ docUrl: string; docId: string; copiedToClipboard?: boolean }> {
  const docText = buildFormattedDocText(result);

  let token = accessToken || localStorage.getItem('gdocs_access_token');

  // Request OAuth Token via Google GSI client if not available
  if (!token) {
    try {
      token = await requestAccessToken();
    } catch (authError: any) {
      console.warn('Google OAuth token request not completed:', authError);
    }
  }

  // If token is valid and available, create document via Google Docs REST API
  if (token) {
    try {
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

      if (createRes.ok) {
        const docData = await createRes.json();
        const documentId = docData.documentId;

        // Insert document content
        await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
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
        }).catch((e) => console.warn('Content insert warning:', e));

        const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;
        return { docUrl, docId: documentId, copiedToClipboard: false };
      } else if (createRes.status === 401) {
        localStorage.removeItem('gdocs_access_token');
      }
    } catch (apiErr) {
      console.warn('Google Docs API request failed, switching to 1-click Docs creator:', apiErr);
    }
  }

  // 1-Click Fallback: Copy full formatted script to clipboard & open docs.new
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(docText);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = docText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  } catch (clipErr) {
    console.warn('Clipboard write fallback error:', clipErr);
  }

  // Open brand new Google Doc creation window
  window.open('https://docs.new', '_blank');

  return {
    docUrl: 'https://docs.new',
    docId: 'instant-google-docs',
    copiedToClipboard: true,
  };
}

/**
 * Request Access Token using Google Identity Services (GSI)
 */
export async function requestAccessToken(): Promise<string> {
  const isLoaded = await ensureGsiScriptLoaded();

  if (!isLoaded || !window.google?.accounts?.oauth2) {
    // If GSI script fails to load, prompt for token or fallback
    const manualToken = prompt(
      'הכנס Google Access Token לשמירה ב-Docs (או לחץ אישור למעבר לייצוא מהיר בלחיצה אחת):'
    );
    if (manualToken) {
      localStorage.setItem('gdocs_access_token', manualToken);
      return manualToken;
    }
    throw new Error('GSI_UNAVAILABLE');
  }

  return new Promise((resolve, reject) => {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

    if (!clientId) {
      // If no client_id is set, prompt for manual token or fallback to 1-click export
      const manualToken = prompt(
        'הזן Google Access Token לשמירה ב-Docs (או לחץ ביטול ליצירת מסמך Docs בלחיצה אחת):'
      );
      if (manualToken) {
        localStorage.setItem('gdocs_access_token', manualToken);
        return resolve(manualToken);
      }
      return reject(new Error('NO_CLIENT_ID'));
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
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

