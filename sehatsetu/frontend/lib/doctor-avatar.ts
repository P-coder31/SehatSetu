/**
 * Maps doctor names or specialties to high quality AI-generated portrait images.
 * Provides instant photorealistic avatars with graceful fallback.
 */
export function getDoctorAvatarUrl(name?: string, specialty?: string): string {
  if (!name) return '/illustrations/doctor_rajesh.jpg';
  const lowerName = name.toLowerCase();
  const lowerSpec = (specialty || '').toLowerCase();

  if (lowerName.includes('ananya') || lowerSpec.includes('pediatric')) {
    return '/illustrations/doctor_ananya.jpg';
  }
  if (lowerName.includes('priya') || lowerName.includes('nair') || lowerSpec.includes('dent') || lowerSpec.includes('oral')) {
    return '/illustrations/doctor_priya.jpg';
  }
  if (lowerName.includes('arjun') || lowerName.includes('mehta') || lowerSpec.includes('cardio') || lowerSpec.includes('heart')) {
    return '/illustrations/doctor_arjun.jpg';
  }
  // Default to Dr. Rajesh Kumar
  return '/illustrations/doctor_rajesh.jpg';
}
