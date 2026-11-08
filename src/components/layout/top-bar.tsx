import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { formatDate } from '@/core/format';
import { colors } from '@/core/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import { isStockLow } from '@/features/clinic/selectors';
import { Avatar } from '@/components/ui/avatar';
import { BrandMark } from '@/components/ui/brand-mark';
import { IconButton } from '@/components/ui/icon-button';

type TopBarVariant = 'brand' | 'back' | 'plain';

type TopBarProps = {
  variant?: TopBarVariant;
  title?: string;
  eyebrow?: string;
  onBack?: () => void;
  extra?: ReactNode;
  right?: ReactNode;
};

export function TopBar({
  variant = 'brand',
  title,
  eyebrow,
  onBack,
  extra,
  right,
}: TopBarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { tickets, invoices, stockItems, records, staff } = useClinic();

  const waiting = tickets.filter((ticket) => ticket.status === 'waiting').length;
  const openBills = invoices.filter((invoice) => invoice.status === 'open').length;
  const lowStock = stockItems.filter(isStockLow).length;
  const pendingPrescriptions = records.filter(
    (record) => !record.handedOver && record.prescription.length > 0,
  ).length;

  const showNotification = () => {
    const lines: string[] = [];
    if (user?.role === 'administrator') {
      lines.push(`${waiting} antrean masih menunggu.`);
      lines.push(`${openBills} tagihan belum dibayar.`);
      lines.push(`${lowStock} item obat menipis atau habis.`);
      lines.push(`${staff.filter((member) => !member.active).length} akun staf nonaktif.`);
    } else if (user?.role === 'doctor' || user?.role === 'nurse') {
      lines.push(`${waiting} pasien menunggu di seluruh poli.`);
      lines.push(`${pendingPrescriptions} resep belum diserahkan.`);
    } else if (user?.role === 'registration') {
      lines.push(`${waiting} antrean masih menunggu.`);
      lines.push(`${tickets.filter((ticket) => ticket.status === 'called').length} pasien sedang dipanggil.`);
    } else if (user?.role === 'pharmacy') {
      lines.push(`${pendingPrescriptions} resep menunggu diserahkan.`);
      lines.push(`${lowStock} item obat perlu restock.`);
    } else if (user?.role === 'cashier') {
      lines.push(`${openBills} tagihan belum dibayar.`);
    }
    Alert.alert('Ringkasan hari ini', lines.join('\n') || 'Tidak ada notifikasi baru.', [
      { text: 'Tutup' },
    ]);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/beranda');
    }
  };

  const brandContent = (
    <View style={styles.brandRow}>
      <BrandMark size={30} />
      <View style={styles.brandCopy}>
        <Text style={styles.brandTitle}>PUSKESMAS</Text>
        <Text style={styles.brandSubtitle}>Layanan terpadu · {formatDate(new Date())}</Text>
      </View>
      <View style={styles.rightRow}>
        {extra}
        <View>
          <IconButton
            icon="notifications-outline"
            label="Ringkasan notifikasi"
            variant="quiet"
            size={38}
            onPress={showNotification}
          />
          <View style={styles.notificationDot} />
        </View>
        {user ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka profil"
            onPress={() => router.push('/profil')}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <Avatar name={user.name} size={34} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const backContent = (
    <View style={styles.backRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        hitSlop={8}
        onPress={handleBack}
        style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.65 }]}
      >
        <Ionicons name="arrow-back" size={18} color={colors.ink} />
      </Pressable>
      <View style={styles.backCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.backTitle} numberOfLines={1}>
          {title ?? 'Kembali'}
        </Text>
      </View>
      {right ? <View style={styles.rightRow}>{right}</View> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {variant === 'brand' ? brandContent : null}
        {variant === 'back' ? backContent : null}
        {variant === 'plain' ? (
          <View style={styles.plainRow}>
            <View style={styles.backCopy}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.backTitle}>{title}</Text>
            </View>
            {right ? <View style={styles.rightRow}>{right}</View> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: colors.canvas,
  },
  inner: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 42,
  },
  brandCopy: {
    flex: 1,
    gap: 1,
  },
  brandTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.ink,
  },
  brandSubtitle: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '500',
    color: colors.muted,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.canvasDeep,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 42,
  },
  plainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backCopy: {
    flex: 1,
    gap: 1,
  },
  eyebrow: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.tealDeep,
  },
  backTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.ink,
  },
});
