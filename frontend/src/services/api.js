import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const getMISOData = async () => {
  try {
    const response = await axios.get(`${API_URL}/miso-rt-data/`);
    
    if (!response.data || !response.data.nodes) {
      throw new Error('No data received from API');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching MISO data from backend API:', error);
    throw error;
  }
}; 