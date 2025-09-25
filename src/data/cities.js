export const popularCities = [
  'London', 'Paris', 'Tokyo', 'New York', 'Sydney',
  'Bangkok', 'Singapore', 'Dubai', 'Berlin', 'Rome',
  'Madrid', 'Amsterdam', 'Seoul', 'Mumbai', 'Beijing',
  'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong',
  'Los Angeles', 'San Francisco', 'Chicago', 'Miami', 'Las Vegas',
  'Vancouver', 'Toronto', 'Montreal', 'Mexico City', 'Buenos Aires',
  'Rio de Janeiro', 'São Paulo', 'Cairo', 'Cape Town', 'Nairobi',
  'Moscow', 'St Petersburg', 'Istanbul', 'Athens', 'Vienna',
  'Prague', 'Budapest', 'Warsaw', 'Stockholm', 'Copenhagen',
  'Oslo', 'Helsinki', 'Brussels', 'Zurich', 'Geneva'
];

export function filterCities(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  return popularCities
    .filter(city => city.toLowerCase().includes(q))
    .slice(0, 5);
}