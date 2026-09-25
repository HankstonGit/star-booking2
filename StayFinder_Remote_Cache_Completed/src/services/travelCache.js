import AsyncStorage from
  '@react-native-async-storage/async-storage';

const CACHE_PREFIX =
  'stayfinder-conditions-';

export async function saveTravelCache(
  cityId,
  weather
) {
  const cacheData = {
    savedAt: Date.now(),
    weather: weather,
  };

  await AsyncStorage.setItem(
    `${CACHE_PREFIX}${cityId}`,
    JSON.stringify(cacheData)
  );
}

export async function loadTravelCache(
  cityId
) {
  const savedData =
    await AsyncStorage.getItem(
      `${CACHE_PREFIX}${cityId}`
    );

  if (savedData === null) {
    return null;
  }

  return JSON.parse(savedData);
}
