import axios from 'axios';

const WP_URL = 'https://morningbiblesip.com/wp-json/wp/v2';
const WP_API = axios.create({ baseURL: WP_URL });

export async function getDevotionals(page = 1) {
  try {
    const res = await WP_API.get(`/devotion?per_page=10&page=${page}&_embed`);
    return res.data;
  } catch (error) {
    console.error('Error fetching devotionals:', error);
    return [];
  }
}

export async function getPrayers(page = 1) {
  try {
    const res = await WP_API.get(`/prayer?per_page=10&page=${page}&_embed`);
    return res.data;
  } catch (error) {
    console.error('Error fetching prayers:', error);
    return [];
  }
}

export async function getTestimonies(page = 1) {
  try {
    const res = await WP_API.get(`/testimony?per_page=10&page=${page}&_embed`);
    return res.data;
  } catch (error) {
    console.error('Error fetching testimonies:', error);
    return [];
  }
}

export async function getRecentVerse() {
  try {
    // Assuming the most recent devotion has the verse of the day
    const res = await WP_API.get(`/devotion?per_page=1&_embed`);
    if (res.data && res.data.length > 0) {
      const dev = res.data[0];
      // Try to extract verse from custom fields or content
      // If we don't have a specific field, we return a fallback or excerpt
      return {
        text: dev.title.rendered,
        reference: 'Today\'s Devotional'
      };
    }
  } catch (error) {
    console.warn('Fallback verse used:', error);
  }
  return {
    text: 'Trust in the Lord with all your heart and lean not on your own understanding.',
    reference: 'Proverbs 3:5',
  };
}

export async function sendPrayerRequest(name, email, request) {
  try {
    const res = await axios.post('https://morningbiblesip.com/wp-json/mbsm/v1/prayer-request', {
      name: name,
      email: email,
      prayer_request: request
    });
    return res.data;
  } catch (error) {
    console.error('Error sending prayer request:', error);
    throw error;
  }
}
export async function getReflection() {
  try {
    // Try custom post type 'reflection' first
    const res = await WP_API.get('/reflection?per_page=1&_embed');
    if (res.data && res.data.length > 0) return res.data[0];
  } catch (e) {
    console.log('Reflection CPT not found, trying standard posts...');
    try {
      // Fallback to standard posts
      const res = await WP_API.get('/posts?per_page=1&_embed');
      if (res.data && res.data.length > 0) return res.data[0];
    } catch (err) {
      console.error('Error fetching reflection:', err);
    }
  }
  return null;
}
export async function getHymns(page = 1) {
  try {
    // Custom post type 'hymn'
    const res = await WP_API.get(`/hymn?per_page=20&page=${page}&_embed`);
    return res.data;
  } catch (error) {
    console.error('Error fetching hymns:', error);
    return [];
  }
}
