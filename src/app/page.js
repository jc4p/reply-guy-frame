'use client';

import { useState } from 'react';
import Image from "next/image";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const analyzeProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/analyze-profile?fid=${window.userFid}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('=== Frontend Analysis Data ===');
        console.log('Full analysis:', data);
        console.log('Stats:', data.stats);
        console.log('Top interactions:', data.top_interactions);
        setAnalysis(data);
      } else {
        setError(data.error || 'Failed to analyze profile');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      const primaryType = analysis.user_type.primary_type;
      const otherTypes = analysis.user_type.all_types
        .filter(type => type.type !== primaryType.type);
      
      const shareText = `I'm a certified ${primaryType.type}! Identify yours now!`;

      // Generate and upload the share image
      const response = await fetch('/api/generate-share-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: analysis.fid || window.userFid,
          trait: primaryType.type,
          analysis: analysis
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate share image');
      }

      const { imageUrl } = await response.json();
      console.log('Share text:', shareText);
      console.log('Share image:', imageUrl);

      // Create Warpcast share URL with FID-specific OG URL as embed
      const encodedText = encodeURIComponent(shareText);
      const encodedEmbed = encodeURIComponent(`${window.location.origin}?fid=${analysis.fid || window.userFid}`);
      const shareUrl = `https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedEmbed}`;

      // Open share URL using Frame SDK
      if (window.frame?.sdk?.actions?.openUrl) {
        window.frame.sdk.actions.openUrl(shareUrl);
      } else {
        console.error('Frame SDK not available for sharing');
        setError('Unable to open share dialog');
      }
    } catch (error) {
      console.error('Error preparing share:', error);
      setError('Failed to generate share image');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-quartz text-text-light">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-20">
        <main className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">
            Are You A Reply Guy?
          </h1>
          
          <p className="text-lg sm:text-xl max-w-2xl opacity-90">
            Analyze your Farcaster casts and get insights about your posting habits
          </p>

          <div className="w-full max-w-sm mt-4">
            <button
              onClick={analysis ? handleShare : analyzeProfile}
              disabled={loading || sharing}
              className={`w-full py-4 px-8 rounded-xl font-semibold 
                         transform transition-all duration-200 
                         hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg hover:shadow-xl
                         focus:outline-none focus:ring-2 focus:ring-opacity-50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         ${analysis 
                           ? 'bg-dark-persian text-text-light focus:ring-dark-persian' 
                           : 'bg-bright-orchid text-text-darker focus:ring-bright-orchid'
                         }`}
            >
              {loading ? 'Analyzing...' : (
                analysis ? (
                  sharing ? 'Sharing...' : 'Share My Results'
                ) : 'Analyze My Casts'
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 text-red-100 rounded-lg">
              {error}
            </div>
          )}

          {analysis && (
            <div className="w-full max-w-lg p-6 rounded-2xl bg-black/10 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={analysis.profile_pic} 
                  alt={analysis.display_name} 
                  className="w-16 h-16 rounded-full"
                />
                <div className="text-left">
                  <h3 className="font-bold text-xl">{analysis.display_name}</h3>
                  <p className="text-bright-orchid">@{analysis.username}</p>
                </div>
              </div>

              {analysis.user_type?.primary_type && (
                <div className="mb-8 p-4 rounded-xl bg-black/20 text-center">
                  <p className="text-2xl font-bold text-bright-orchid mb-2">
                    {analysis.user_type.primary_type.type} ({analysis.user_type.primary_type.percentage}%)
                  </p>
                  <p className="text-sm opacity-90">
                    {analysis.user_type.primary_type.description}
                  </p>
                </div>
              )}

              {analysis.insights?.length > 0 && (
                <div className="mb-8 space-y-6">
                  {analysis.insights.map((insight, index) => (
                    <div key={index} className="p-4 rounded-xl bg-black/10">
                      <h4 className="text-bright-orchid font-semibold mb-3">
                        {insight.title}
                      </h4>
                      <ul className="space-y-2">
                        {insight.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="text-sm leading-relaxed opacity-90">
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {analysis.user_type?.all_types?.length > 1 && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold mb-3 opacity-70">Also Qualified As:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.user_type.all_types
                      .filter(type => type.type !== analysis.user_type.primary_type.type)
                      .map((type, index) => (
                        <div key={index} className="px-3 py-1 rounded-full bg-black/5 text-sm">
                          {type.type} ({type.percentage}%)
                        </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-left col-span-2">
                  <h4 className="text-lg font-semibold mb-2 text-bright-orchid">Posting Habits</h4>
                </div>
                <div className="text-left">
                  <p className="text-sm opacity-70">Posts</p>
                  <p className="text-2xl font-bold">{analysis.stats.total_posts}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm opacity-70">Replies</p>
                  <p className="text-2xl font-bold">{analysis.stats.total_replies}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm opacity-70">Reply Percentage</p>
                  <p className="text-2xl font-bold">{analysis.stats.reply_percentage}%</p>
                </div>
                <div className="text-left">
                  <p className="text-sm opacity-70">Unique Users Replied To</p>
                  <p className="text-2xl font-bold">{analysis.stats.unique_fids_replied_to}</p>
                </div>

                <div className="text-left col-span-2 mt-4">
                  <h4 className="text-lg font-semibold mb-2 text-bright-orchid">Engagement</h4>
                </div>
                <div className="text-left">
                  <p className="text-sm opacity-70">Total Likes</p>
                  <p className="text-2xl font-bold">{analysis.stats.total_likes}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm opacity-70">Total Recasts</p>
                  <p className="text-2xl font-bold">{analysis.stats.total_recasts}</p>
                </div>
                <div className="text-left col-span-2">
                  <p className="text-sm opacity-70">Unique Users Liked</p>
                  <p className="text-2xl font-bold">{analysis.stats.unique_fids_liked}</p>
                </div>

                {analysis.top_interactions?.most_replied_to?.length > 0 && (
                  <div className="text-left col-span-2 mt-6">
                    <h4 className="text-lg font-semibold mb-4 text-bright-orchid">Top Interactions</h4>
                    
                    <div className="space-y-6">
                      <div>
                        <h5 className="text-sm opacity-70 mb-2">Most Replied To</h5>
                        <div className="space-y-2">
                          {analysis.top_interactions.most_replied_to.map((user, index) => (
                            <div key={user.fid} className="flex items-center gap-3 p-2 rounded-lg bg-black/5">
                              <img 
                                src={user.pfp_url} 
                                alt={user.display_name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{user.display_name}</p>
                                <p className="text-sm text-bright-orchid truncate">@{user.username}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">{user.count}</p>
                                <p className="text-xs opacity-70">replies</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {analysis.top_interactions?.most_liked?.length > 0 && (
                        <div>
                          <h5 className="text-sm opacity-70 mb-2">Most Liked</h5>
                          <div className="space-y-2">
                            {analysis.top_interactions.most_liked.map((user, index) => (
                              <div key={user.fid} className="flex items-center gap-3 p-2 rounded-lg bg-black/5">
                                <img 
                                  src={user.pfp_url} 
                                  alt={user.display_name}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{user.display_name}</p>
                                  <p className="text-sm text-bright-orchid truncate">@{user.username}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold">{user.count}</p>
                                  <p className="text-xs opacity-70">likes</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!analysis && (
            <div className="mt-8 p-6 rounded-2xl bg-black/10 backdrop-blur-sm max-w-lg">
              <h2 className="text-xl font-semibold mb-4">
                What You&apos;ll Get
              </h2>
              <ul className="text-left space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-bright-orchid">•</span>
                  Detailed posting patterns
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-bright-orchid">•</span>
                  Engagement analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-bright-orchid">•</span>
                  Content insights
                </li>
              </ul>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
