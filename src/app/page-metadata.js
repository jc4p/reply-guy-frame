export async function generateFrameMetadata({ searchParams }) {
  const image = await searchParams?.image;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  const imageUrl = image 
    ? `https://images.kasra.codes/reply-guy/${image}.png`
    : "https://cover-art.kasra.codes/reply-guy-icon-512-square.png";

  console.log('Returning fc:frame with imageUrl:', imageUrl);

  return {
    title: "Are You A Reply Guy?",
    description: "Analyze your Farcaster casts and discover your posting personality",
    icons: {
      icon: "https://cover-art.kasra.codes/reply-guy-icon-512.png",
      shortcut: "https://cover-art.kasra.codes/reply-guy-icon-512.png",
      apple: "https://cover-art.kasra.codes/reply-guy-icon-512.png",
    },
    other: {
      'fc:frame': JSON.stringify({
        version: "next",
        imageUrl,
        button: {
          title: "Analyze My Casts",
          action: {
            type: "launch_frame",
            name: "Reply Guy Analyzer",
            url: baseUrl,
            splashImageUrl: imageUrl,
            splashBackgroundColor: "#274374"
          }
        }
      })
    }
  };
} 