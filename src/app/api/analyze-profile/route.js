import { NextResponse } from 'next/server';
import { getCachedProfile, getCachedCasts, getCachedReactions } from '@/lib/cloudflare';

async function getAllCasts(fid) {
  let allCasts = [];
  let nextCursor = null;
  let pageCount = 0;
  const MAX_PAGES = 10;

  do {
    const response = await getCachedCasts(fid, nextCursor);
    allCasts = [...allCasts, ...response.casts];
    nextCursor = response.next?.cursor;
    pageCount++;
  } while (nextCursor && pageCount < MAX_PAGES);

  return allCasts;
}

async function getAllReactions(fid) {
  let allReactions = [];
  let nextCursor = null;
  let pageCount = 0;
  const MAX_PAGES = 10;

  do {
    const response = await getCachedReactions(fid, nextCursor);
    allReactions = [...allReactions, ...response.reactions];
    nextCursor = response.next?.cursor;
    pageCount++;
  } while (nextCursor && pageCount < MAX_PAGES);

  return allReactions;
}

async function fetchUsersByFids(fids) {
  const uniqueFids = [...new Set(fids)].filter(Boolean);
  if (uniqueFids.length === 0) return [];

  // Get cached profiles for each FID
  const profiles = await Promise.all(
    uniqueFids.map(fid => getCachedProfile(fid))
  );

  return profiles.flatMap(response => response.users);
}

function getTopInteractions(interactions, limit = 5) {
  return Object.entries(interactions)
    .filter(([fid]) => fid !== 'null' && fid !== null)  // Filter out null FIDs
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([fid, count]) => ({
      fid: parseInt(fid),
      count
    }));
}

function determineUserType(stats) {
  const {
    total_posts,
    total_replies,
    reply_percentage,
    total_likes,
    total_recasts,
    unique_fids_replied_to,
    unique_fids_liked
  } = stats;

  const total_interactions = total_posts + total_replies;
  const likes_per_post = total_likes / total_interactions;
  const unique_reply_ratio = unique_fids_replied_to / total_replies;
  
  // Primary Categories with raw scores
  const categories = [];
  
  // Reply Guy Analysis
  if (reply_percentage > 30) {
    const replyScore = 
      (reply_percentage * 0.5) + // Weight for reply percentage
      (unique_reply_ratio * 30) + // Weight for reply diversity
      (total_replies * 0.2); // Small bonus for volume
    
    if (unique_reply_ratio > 0.7) {
      categories.push({
        type: "Social Butterfly",
        description: "You reply to everyone! A true conversation starter.",
        score: replyScore
      });
    } else {
      categories.push({
        type: "Reply Guy",
        description: "You love jumping into conversations!",
        score: replyScore
      });
    }
  }

  // Lurker Analysis
  if (likes_per_post > 2) {
    const lurkerScore = 
      (likes_per_post * 5) + // Weight for likes per post
      (total_likes * 0.1) + // Weight for total likes
      ((unique_fids_liked / total_likes) * 40); // Weight for like diversity
    
    categories.push({
      type: "Silent Observer",
      description: "You prefer to show appreciation from the sidelines.",
      score: lurkerScore
    });
  }

  // Post and Ghost Analysis
  if (reply_percentage < 70) {
    const ghostScore = 
      ((100 - reply_percentage) * 0.5) + // Weight for low reply rate
      (total_posts * 0.5) + // Weight for post count
      (total_likes / total_posts * 2); // Weight for post engagement
    
    categories.push({
      type: "Post and Ghost",
      description: "Drop your thoughts and dash – mysterious!",
      score: ghostScore
    });
  }

  // Community Builder
  if (unique_fids_liked > 20 || unique_fids_replied_to > 10) {
    const communityScore = 
      (unique_fids_liked * 0.3) + // Weight for unique likes
      (unique_fids_replied_to * 0.4) + // Weight for unique replies
      ((total_likes + total_replies) / total_posts * 2) + // Weight for engagement ratio
      Math.min(50, total_posts * 0.5); // Capped bonus for post count
    
    categories.push({
      type: "Community Builder",
      description: "You're actively building connections across the community!",
      score: communityScore
    });
  }

  // Content Creator
  if (total_posts > 20) {
    const creatorScore = 
      (total_posts * 0.5) + // Weight for post count
      ((total_likes + total_recasts) / total_posts * 3) + // Weight for engagement per post
      (unique_fids_liked * 0.2) + // Small bonus for community reach
      Math.min(30, total_replies * 0.1); // Capped bonus for replies
    
    categories.push({
      type: "Content Creator",
      description: "You're consistently creating engaging content!",
      score: creatorScore
    });
  }

  // Signal Booster
  if (total_recasts > 0) {
    const boosterScore = 
      (total_recasts * 2) + // Base weight for recasts
      (total_recasts / total_posts * 20) + // Weight for recast ratio
      (total_recasts / total_likes * 20); // Weight for recast vs like ratio
    
    categories.push({
      type: "Signal Booster",
      description: "You love amplifying others' voices!",
      score: boosterScore
    });
  }

  // Sort by score
  categories.sort((a, b) => b.score - a.score);

  // If no categories, add balanced user
  if (categories.length === 0) {
    categories.push({
      type: "Balanced User",
      description: "You maintain a healthy mix of different interactions.",
      score: 50
    });
  }

  console.log('Raw scores before normalization:', 
    categories.map(c => `${c.type}: ${c.score}`).join(', ')
  );

  // Normalize scores relative to the highest score
  const highestScore = categories[0].score;
  categories.forEach(category => {
    category.percentage = Math.round((category.score / highestScore) * 100);
  });

  return {
    primary_type: categories[0],
    all_types: categories,
    details: {
      reply_percentage,
      likes_per_post: Math.round(likes_per_post * 10) / 10,
      unique_reply_ratio: Math.round(unique_reply_ratio * 100)
    }
  };
}

function generateInsights(stats, topInteractions, userType) {
  const insights = [];
  const {
    total_posts,
    total_replies,
    reply_percentage,
    total_likes,
    total_recasts,
    unique_fids_replied_to,
    unique_fids_liked
  } = stats;

  // Helper to get username display
  const getUserDisplay = (user) => user ? `${user.display_name} (@${user.username})` : 'someone';

  // Reply Guy / Social Butterfly Insights
  if (reply_percentage > 60) {
    const topRepliedTo = topInteractions.most_replied_to[0];
    const replyDiversity = (unique_fids_replied_to / total_replies) * 100;
    
    insights.push({
      title: "Reply Patterns",
      details: [
        `You reply the most to ${getUserDisplay(topRepliedTo)} (${topRepliedTo?.count} replies)`,
        replyDiversity > 70 
          ? "You're great at engaging with many different people!"
          : "You tend to focus your replies on a select group of users."
      ]
    });
  }

  // Silent Observer Insights
  if (userType.primary_type.type === "Silent Observer") {
    const likeDiversity = (unique_fids_liked / total_likes) * 100;
    const topLiked = topInteractions.most_liked[0];
    
    insights.push({
      title: "Appreciation Patterns",
      details: [
        `You've shown the most appreciation for ${getUserDisplay(topLiked)} (${topLiked?.count} likes)`,
        likeDiversity > 70
          ? "You spread your likes widely across the community"
          : "You tend to consistently appreciate content from your favorite creators"
      ]
    });
  }

  // Post and Ghost Insights
  if (reply_percentage < 30 && total_posts > 0) {
    const avgLikesPerPost = total_likes / total_posts;
    insights.push({
      title: "Posting Style",
      details: [
        `You average ${Math.round(avgLikesPerPost * 10) / 10} likes per post`,
        total_recasts > total_posts * 0.5
          ? "You're good at amplifying others while maintaining your own voice"
          : "You prefer to share your own thoughts rather than amplify others"
      ]
    });
  }

  // Community Builder Insights
  if (unique_fids_liked > 50 && unique_fids_replied_to > 20) {
    insights.push({
      title: "Community Impact",
      details: [
        `You've meaningfully interacted with ${unique_fids_liked + unique_fids_replied_to} different users`,
        `Your engagement ratio is ${Math.round((total_likes + total_replies) / total_posts * 10) / 10} interactions per post`
      ]
    });
  }

  // Signal Booster Insights
  if (total_recasts > total_likes * 0.5) {
    insights.push({
      title: "Content Amplification",
      details: [
        `You've recasted ${total_recasts} posts`,
        `That's ${Math.round((total_recasts / (total_posts + total_replies)) * 100)}% of your total activity`
      ]
    });
  }

  // General Insights (always included)
  insights.push({
    title: "Activity Overview",
    details: [
      `Most active in: ${reply_percentage > 50 ? 'Conversations' : 'Original posts'}`,
      `Engagement style: ${total_likes > total_recasts ? 'Likes' : 'Recasts'} are your preferred way to engage`
    ]
  });

  return insights;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid') || '977233';
    console.log('Analyzing FID:', fid);

    // Fetch user profile using cache
    const profileResponse = await getCachedProfile(fid);
    console.log('Profile:', profileResponse);
    const userProfile = profileResponse.users[0];

    // Fetch all casts and reactions in parallel (now using cache)
    const [allCasts, allReactions] = await Promise.all([
      getAllCasts(fid),
      getAllReactions(fid)
    ]);
    console.log('Total casts fetched:', allCasts.length);
    console.log('Sample cast:', allCasts[0]);
    console.log('Sample cast parent_author:', allCasts[0]?.parent_author);
    
    // Count casts by parent type
    const castTypes = allCasts.reduce((acc, cast) => {
      if (!cast.parent_author) {
        acc.noParent = (acc.noParent || 0) + 1;
      } else if (cast.parent_author.fid === null) {
        acc.nullFid = (acc.nullFid || 0) + 1;
      } else {
        acc.validParent = (acc.validParent || 0) + 1;
      }
      return acc;
    }, {});
    console.log('Cast types breakdown:', castTypes);

    // Analyze casts
    const repliedToFids = new Set();
    const replyCountByFid = {};
    let replyCount = 0;
    let postCount = 0;

    allCasts.forEach(cast => {
      if (cast.parent_author?.fid) {  // Check that parent_author.fid exists and is not null
        // If it's a reply to someone else's post
        if (cast.parent_author.fid !== parseInt(fid)) {
          replyCount++;
          repliedToFids.add(cast.parent_author.fid);
          replyCountByFid[cast.parent_author.fid] = (replyCountByFid[cast.parent_author.fid] || 0) + 1;
        } else {
          // It's a reply to their own post, count as a post
          postCount++;
        }
      } else {
        // No parent or null FID, it's a top-level post
        postCount++;
      }
    });

    console.log('Reply count by FID:', replyCountByFid);
    console.log('Total replies:', replyCount);
    console.log('Total posts:', postCount);

    // Analyze reactions
    const likedFids = new Set();
    const likeCountByFid = {};
    let likeCount = 0;
    let recastCount = 0;

    allReactions.forEach(reaction => {
      if (reaction.reaction_type === 'like') {
        likeCount++;
        if (reaction.cast?.author?.fid) {
          const authorFid = reaction.cast.author.fid;
          likedFids.add(authorFid);
          likeCountByFid[authorFid] = (likeCountByFid[authorFid] || 0) + 1;
        }
      } else if (reaction.reaction_type === 'recast') {
        recastCount++;
      }
    });

    console.log('Like count by FID:', likeCountByFid);
    console.log('Total likes:', likeCount);
    console.log('Total recasts:', recastCount);

    // Get top 5 most interacted with users
    const topRepliedTo = getTopInteractions(replyCountByFid);
    const topLiked = getTopInteractions(likeCountByFid);

    console.log('Top replied to:', topRepliedTo);
    console.log('Top liked:', topLiked);

    // Fetch user details for top interacted users
    const allInteractedFids = [...topRepliedTo, ...topLiked].map(i => i.fid);
    console.log('All interacted FIDs:', allInteractedFids);
    const interactedUsers = await fetchUsersByFids(allInteractedFids);
    console.log('Interacted users:', interactedUsers);

    // Create a map for quick user lookup
    const userMap = Object.fromEntries(
      interactedUsers.map(user => [user.fid, {
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url
      }])
    );
    console.log('User map:', userMap);

    // Add user details to top interactions
    const topInteractions = {
      most_replied_to: topRepliedTo.map(interaction => ({
        ...interaction,
        ...userMap[interaction.fid]
      })),
      most_liked: topLiked.map(interaction => ({
        ...interaction,
        ...userMap[interaction.fid]
      }))
    };
    console.log('Final top interactions:', topInteractions);

    const replyPercentage = (replyCount / (postCount + replyCount)) * 100;

    const userType = determineUserType({
      total_posts: postCount,
      total_replies: replyCount,
      reply_percentage: Math.round(replyPercentage * 100) / 100,
      unique_fids_replied_to: repliedToFids.size,
      total_likes: likeCount,
      total_recasts: recastCount,
      unique_fids_liked: likedFids.size
    });

    const insights = generateInsights(
      {
        total_posts: postCount,
        total_replies: replyCount,
        reply_percentage: Math.round(replyPercentage * 100) / 100,
        unique_fids_replied_to: repliedToFids.size,
        total_likes: likeCount,
        total_recasts: recastCount,
        unique_fids_liked: likedFids.size
      },
      topInteractions,
      userType
    );

    const analysis = {
      username: userProfile.username,
      profile_pic: userProfile.pfp_url,
      display_name: userProfile.display_name,
      stats: {
        total_posts: postCount,
        total_replies: replyCount,
        reply_percentage: Math.round(replyPercentage * 100) / 100,
        unique_fids_replied_to: repliedToFids.size,
        total_likes: likeCount,
        total_recasts: recastCount,
        unique_fids_liked: likedFids.size
      },
      top_interactions: topInteractions,
      user_type: userType,
      insights
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing profile:', error);
    return NextResponse.json(
      { error: 'Failed to analyze profile' },
      { status: 500 }
    );
  }
} 