import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { jobsApi } from '../api/jobs';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LeaveReview'>;
  route: RouteProp<RootStackParamList, 'LeaveReview'>;
};

function StarRating({ rating, onRate, size = 32 }: { rating: number; onRate: (n: number) => void; size?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onRate(n)} activeOpacity={0.7}>
          <Ionicons
            name={n <= rating ? 'star' : 'star-outline'}
            size={size}
            color={n <= rating ? colors.amber400 : colors.slate300}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function LeaveReviewScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { jobId, revieweeName, reviewType } = route.params;
  // Generalized: covers both worker and agency variants on each side.
  const isConsumerReview = reviewType.startsWith('CONSUMER_TO_');
  const isAgencyReviewee = reviewType === 'CONSUMER_TO_AGENCY';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [qualityRating, setQualityRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [reliabilityRating, setReliabilityRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Required', 'Please select an overall rating.');
      return;
    }

    setSubmitting(true);
    try {
      const data: any = { rating, comment: comment.trim() || undefined };
      if (isConsumerReview) {
        if (qualityRating > 0) data.qualityRating = qualityRating;
        if (punctualityRating > 0) data.punctualityRating = punctualityRating;
        if (communicationRating > 0) data.communicationRating = communicationRating;
        if (valueRating > 0) data.valueRating = valueRating;
      } else {
        if (communicationRating > 0) data.communicationRating = communicationRating;
        if (reliabilityRating > 0) data.reliabilityRating = reliabilityRating;
      }

      await jobsApi.createReview(jobId, data);
      Alert.alert('Thank you!', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit review.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* Reviewee Info */}
        <View style={styles.revieweeCard}>
          <Ionicons name="person-circle" size={48} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.revieweeName}>{revieweeName}</Text>
            <Text style={styles.revieweeRole}>
              {isAgencyReviewee ? 'Agency' : isConsumerReview ? 'Worker' : 'Client'}
            </Text>
          </View>
        </View>

        {/* Overall Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Rating *</Text>
          <StarRating rating={rating} onRate={setRating} size={40} />
          <Text style={styles.ratingLabel}>
            {rating === 0 ? 'Tap a star to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </Text>
        </View>

        {/* Sub-ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Ratings</Text>
          <Text style={styles.sectionSubtitle}>Optional — helps others make better decisions</Text>

          {isConsumerReview ? (
            <>
              <SubRating label="Quality of Work" rating={qualityRating} onRate={setQualityRating} icon="construct" />
              <SubRating label="Punctuality" rating={punctualityRating} onRate={setPunctualityRating} icon="time" />
              <SubRating label="Communication" rating={communicationRating} onRate={setCommunicationRating} icon="chatbubble" />
              <SubRating label="Value for Money" rating={valueRating} onRate={setValueRating} icon="cash" />
            </>
          ) : (
            <>
              <SubRating label="Communication" rating={communicationRating} onRate={setCommunicationRating} icon="chatbubble" />
              <SubRating label="Reliability" rating={reliabilityRating} onRate={setReliabilityRating} icon="shield-checkmark" />
            </>
          )}
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience..."
            placeholderTextColor={colors.slate400}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (rating === 0 || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={colors.white} />
              <Text style={styles.submitText}>Submit Review</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SubRating({ label, rating, onRate, icon }: { label: string; rating: number; onRate: (n: number) => void; icon: string }) {
  return (
    <View style={styles.subRatingRow}>
      <View style={styles.subRatingLabel}>
        <Ionicons name={icon as any} size={16} color={colors.slate500} />
        <Text style={styles.subRatingText}>{label}</Text>
      </View>
      <StarRating rating={rating} onRate={onRate} size={22} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.white },
  scrollContent: { padding: 16, paddingBottom: 40 },
  revieweeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.white, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.slate200, marginBottom: 16,
  },
  revieweeName: { fontSize: 18, fontWeight: '700', color: colors.slate900 },
  revieweeRole: { fontSize: 14, color: colors.slate500, marginTop: 2 },
  section: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.slate200, marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.slate900, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: colors.slate400, marginBottom: 12 },
  starRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  ratingLabel: { fontSize: 14, color: colors.slate500, marginTop: 8, textAlign: 'center' },
  subRatingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.slate100,
  },
  subRatingLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subRatingText: { fontSize: 14, color: colors.slate700 },
  commentInput: {
    borderWidth: 1, borderColor: colors.slate200, borderRadius: 10,
    padding: 12, fontSize: 15, color: colors.slate900,
    minHeight: 100, marginTop: 8,
  },
  charCount: { fontSize: 12, color: colors.slate400, textAlign: 'right', marginTop: 4 },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
