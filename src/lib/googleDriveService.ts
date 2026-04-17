import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

async function getAccessToken(): Promise<string> {
  try {
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  } catch {
    try {
      await GoogleSignin.signInSilently();
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch {
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    }
  }
}

async function uploadFile(
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<{ id: string; webViewLink?: string }> {
  const accessToken = await getAccessToken();

  const metadata = JSON.stringify({ name: fileName, mimeType });

  const body = new FormData();
  body.append('metadata', new Blob([metadata], { type: 'application/json' }));
  body.append('file', { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive upload failed (${response.status}): ${text}`);
  }

  return response.json();
}

export function uploadToGoogleDrive(
  fileUri: string,
  fileName: string,
): Promise<{ id: string; webViewLink?: string }> {
  return uploadFile(fileUri, fileName, 'text/csv');
}

export function uploadImageToGoogleDrive(
  fileUri: string,
  fileName: string,
  mimeType = 'image/png',
): Promise<{ id: string; webViewLink?: string }> {
  return uploadFile(fileUri, fileName, mimeType);
}
