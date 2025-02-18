import { ImageResponse } from 'next/og';
import { getCachedProfile } from '@/lib/cloudflare';

export const runtime = 'edge';

// Load font
console.log('Starting font load...');
const karlaFontData = fetch(
  'https://images.kasra.codes/Karla-Regular.ttf'
).then(res => {
  console.log('Font fetch response status:', res.status);
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status} ${res.statusText}`);
  return res.arrayBuffer();
}).then(buffer => {
  console.log('Font buffer size:', buffer.byteLength);
  return buffer;
}).catch(err => {
  console.error('Font loading error:', err);
  throw err;
});

export async function GET(request) {
  try {
    console.log('OG route started');
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const analysisData = searchParams.get('analysis') ? JSON.parse(searchParams.get('analysis')) : null;
    console.log('Params:', { fid, analysisData });
    
    // Wait for font to load
    console.log('Waiting for font...');
    const fontData = await karlaFontData;
    console.log('Font loaded, size:', fontData.byteLength);
    
    if (!fid) {
      console.log('No FID provided, generating default image');
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#274374',
              color: 'white',
              fontFamily: 'Karla',
            }}
          >
            <div style={{ fontSize: 75, marginBottom: 20 }}>🤝</div>
            <div style={{ fontSize: 52, marginBottom: 10 }}>Are You A Reply Guy?</div>
            <div style={{ fontSize: 32, opacity: 0.8 }}>Identify your own personality now!</div>
          </div>
        ),
        {
          width: 1200,
          height: 800,
          fonts: [
            {
              name: 'Karla',
              data: fontData,
              style: 'normal',
            },
          ],
        }
      );
    }

    // Get user profile
    console.log('Fetching profile for FID:', fid);
    const profileResponse = await getCachedProfile(fid);
    console.log('Profile response:', JSON.stringify(profileResponse, null, 2));
    
    if (!profileResponse?.users?.length) {
      console.error('No user found for FID:', fid);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userProfile = profileResponse.users[0];
    console.log('User profile:', JSON.stringify(userProfile, null, 2));

    if (!userProfile.pfp_url || !userProfile.username) {
      console.error('Invalid user profile:', userProfile);
      return new Response(
        JSON.stringify({ error: 'Invalid user profile' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating image response...');
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#274374',
            color: 'white',
            fontFamily: 'Karla',
            padding: 40,
          }}
        >
          {/* Title */}
          <div style={{ 
            fontSize: 72,
            fontWeight: 500,
            marginBottom: 60,
            display: 'flex',
            position: 'absolute',
            top: 40,
          }}>
            Are You A Reply Guy?
          </div>

          {/* Profile row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            marginBottom: 40,
            width: '100%',
          }}>
            <img
              src={userProfile.pfp_url}
              alt={userProfile.username}
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
              }}
            />
            <div style={{ 
              fontSize: 42,
              opacity: 0.9,
              display: 'flex',
            }}>@{userProfile.username}</div>
          </div>

          {/* Main message */}
          <div style={{ 
            fontSize: 56, 
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            display: 'flex',
          }}>
            I'm a certified {analysisData?.user_type?.primary_type?.type} ({analysisData?.user_type?.primary_type?.percentage}%)!
          </div>

          {/* Additional traits */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            marginBottom: 40,
          }}>
            {analysisData?.user_type?.all_types
              ?.filter(type => type.type !== analysisData?.user_type?.primary_type?.type)
              .slice(0, 3)
              .map((type, index) => (
                <div key={index} style={{
                  fontSize: 32,
                  opacity: 0.8,
                  display: 'flex',
                }}>
                  {type.type} ({type.percentage}%)
                </div>
              ))
            }
          </div>

          {/* Call to action */}
          <div style={{ 
            fontSize: 36,
            opacity: 0.8,
            position: 'absolute',
            bottom: 60,
            display: 'flex',
          }}>
            Identify your own personality now!
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 800,
        fonts: [
          {
            name: 'Karla',
            data: fontData,
            style: 'normal',
          },
        ],
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate image' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 