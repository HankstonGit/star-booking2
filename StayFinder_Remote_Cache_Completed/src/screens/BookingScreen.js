import React, {
  useEffect,
  useState,
} from 'react';

import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BookingHeader from '../components/BookingHeader';
import CitySelector from '../components/CitySelector';
import HotelRow from '../components/HotelRow';
import TravelConditionsCard from '../components/TravelConditionsCard';
import {
  ErrorState,
  LoadingState,
} from '../components/RequestStates';

import { cities } from '../data/cities';
import { hotels } from '../data/hotels';

import {
  getTravelConditions,
} from '../services/travelApi';

import {
  loadTravelCache,
  saveTravelCache,
} from '../services/travelCache';

export default function BookingScreen() {
  const [
    selectedCityId,
    setSelectedCityId,
  ] = useState('houston');

  const [
    weather,
    setWeather,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    sourceLabel,
    setSourceLabel,
  ] = useState('');

  const [
    lastUpdatedLabel,
    setLastUpdatedLabel,
  ] = useState('');

  const selectedCity =
    cities.find(
      (city) =>
        city.id === selectedCityId
    );

  const cityHotels =
    hotels.filter(
      (hotel) =>
        hotel.cityId === selectedCityId
    );

  const formatUpdatedTime = (timestamp) => {
    return `Updated ${new Date(
      timestamp
    ).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  };

  async function loadCityData(
    isManualRefresh = false
  ) {
    let cachedData = null;

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setWeather(null);
      setSourceLabel('');
      setLastUpdatedLabel('');
    }

    setErrorMessage('');

    try {
      cachedData =
        await loadTravelCache(
          selectedCity.id
        );

      if (cachedData !== null) {
        setWeather(
          cachedData.weather
        );
        setSourceLabel(
          'Saved cache'
        );
        setLastUpdatedLabel(
          formatUpdatedTime(
            cachedData.savedAt
          )
        );
        setIsLoading(false);
      }

      const freshData =
        await getTravelConditions(
          selectedCity.latitude,
          selectedCity.longitude
        );

      setWeather(freshData);
      setSourceLabel('Live API');
      setLastUpdatedLabel(
        formatUpdatedTime(Date.now())
      );

      await saveTravelCache(
        selectedCity.id,
        freshData
      );
    } catch (error) {
      if (cachedData === null) {
        setWeather(null);
        setErrorMessage(
          'Live destination data could not be loaded and no saved data is available.'
        );
      } else {
        setErrorMessage(
          'Live refresh failed. Showing saved destination data.'
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadCityData();
  }, [selectedCityId]);

  if (
    isLoading &&
    weather === null
  ) {
    return <LoadingState />;
  }

  if (
    errorMessage !== '' &&
    weather === null
  ) {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() =>
          loadCityData()
        }
      />
    );
  }

  return (
    <View style={styles.screen}>
      <BookingHeader
        onRefresh={() =>
          loadCityData(true)
        }
        isRefreshing={isRefreshing}
      />

      <CitySelector
        cities={cities}
        selectedCityId={selectedCityId}
        onSelectCity={
          setSelectedCityId
        }
      />

      {errorMessage !== '' && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {errorMessage}
          </Text>
        </View>
      )}

      <FlatList
        data={cityHotels}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={({ item }) => (
          <HotelRow hotel={item} />
        )}
        ListHeaderComponent={
          <>
            {weather !== null && (
              <TravelConditionsCard
                city={selectedCity}
                weather={weather}
                sourceLabel={sourceLabel}
                lastUpdatedLabel={
                  lastUpdatedLabel
                }
              />
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.eyebrow}>
                STAY OPTIONS
              </Text>
              <Text style={styles.heading}>
                Properties in {selectedCity.name}
              </Text>
              <Text style={styles.subheading}>
                Hotel records remain part of the existing project while destination conditions now come from a remote service.
              </Text>
            </View>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  banner: {
    backgroundColor: '#fff7ed',
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  bannerText: {
    color: '#9a3412',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  eyebrow: {
    color: '#003b95',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heading: {
    marginTop: 4,
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subheading: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 18,
  },
});
