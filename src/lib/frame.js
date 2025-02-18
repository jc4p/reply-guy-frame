const TIMEOUT = 10000;

async function waitForDOMContentLoaded() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        resolve();
      });
    }
  });
}

async function waitForFrameSDK() {
  return new Promise((resolve, reject) => {
    const checkSDK = () => {
      if (window.frame?.sdk) {
        console.log('Frame SDK initialized');
        resolve();
      } else {
        setTimeout(checkSDK, 100);
      }
    };
    setTimeout(() => reject(new Error('Frame SDK initialization timeout')), TIMEOUT);
    checkSDK();
  });
}

async function waitForUser() {
  return new Promise((resolve, reject) => {
    const checkUser = () => {
      console.log('Checking user');
      if (window.frame?.sdk?.context?.user) {
        console.log('User found');
        resolve(window.frame.sdk.context.user);
      } else {
        setTimeout(checkUser, 100);
      }
    };
    setTimeout(() => reject(new Error('User context timeout')), TIMEOUT);
    checkUser();
  });
}

export async function initializeFrame() {
  if (typeof window === 'undefined') return;

  try {
    // Wait for DOM to be ready
    await waitForDOMContentLoaded();
    console.log('DOM Content Loaded');

    // Wait for Frame SDK initialization
    await waitForFrameSDK();

    // Wait for user context
    const user = await waitForUser();

    if (!user || !user.fid) {
      // we're probably not in a frame
      return;
    }

    // Store user info
    window.userFid = user.fid;
    window.userName = user.username || 'Anonymous';
    console.log('User Info:', { fid: window.userFid, username: window.userName });

    // Initialize Frame SDK
    if (window.frame?.sdk?.actions?.ready) {
      console.log('Calling ready');
      await window.frame.sdk.actions.ready();
      console.log('Frame SDK ready');
    }
  } catch (error) {
    console.error('Frame initialization error:', error);
  }
} 