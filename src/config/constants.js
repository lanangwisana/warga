// App Constants - Same APP_ID as Admin for shared data
export const APP_ID = import.meta.env.VITE_APP_ID || 'bumi-adipura-8ed0a';

import defaultEventImage from '../assets/defualt-image-events.png';

// Asset URLs
export const LOGO_URL = "https://lh3.googleusercontent.com/d/1oPheVvQCJmnBBxqfBp1Ev9iHfebaOSvb";
export const USER_PHOTO_URL = "https://images.unsplash.com/profile-1766810764004-0d86c0062c85image?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&q=80";
export const DEFAULT_EVENT_IMAGE = defaultEventImage;

// Gemini API Configuration
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
export const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
