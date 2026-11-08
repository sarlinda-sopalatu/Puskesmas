import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  hasAccess,
  moduleCatalog,
  roleMeta,
  type ModuleGroup,
  type ModuleLink,
} from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AppPage } from '@/components/layout/app-page';
import { PageHeading } from '@/components/layout/page-heading';
import { SectionHeading } from '@/components/layout/section-heading';
import { EmptyNote } from '@/components/ui/empty-note';
import { SearchField } from '@/components/ui/search-field';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { useAuth } from '@/features/auth/auth-provider';

const GROUP_ORDER: ModuleGroup[] = ['Pelayanan', 'Manajemen', 'Akun'];

export default function MenuScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  if (!user) return null;

  const meta = roleMeta[user.role];
  const modules = moduleCatalog.filter((module) => hasAccess(user.role, module.path));
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? modules.filter(
        (module) =>
          module.label.toLowerCase().includes(normalizedQuery) ||
          module.description.toLowerCase().includes(normalizedQuery),
      )
    : modules;

  return (
    <AppPage dock>
      <View style={styles.container}>
        <PageHeading
          eyebrow="Peta aplikasi"
          title="Menu"
          description="Semua modul yang terbuka untuk peran Anda, dikelompokkan agar mudah ditemukan."
          right={<Tag label={`${modules.length} modul`} tone="teal" dot />}
        />

        <Surface variant="dark" style={styles.identityCard}>
          <View style={styles.identityDecor} />
          <View style={styles.identityTop}>
            <View style={[styles.identityIcon, { backgroundColor: meta.tint }]}>
              <Ionicons name={meta.icon} size={18} color={meta.color} />
            </View>
            <Tag label={meta.label} tone="ink" />
          </View>
          <Text style={styles.identityName}>{user.name}</Text>
          <Text style={styles.identityNote}>
            Akses dibatasi otomatis mengikuti peran dan poli yang melekat pada akun.
          </Text>
        </Surface>

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Cari modul, mis. laporan atau antrean…"
        />

        {filtered.length === 0 ? (
          <EmptyNote
            icon="search-outline"
            title="Modul tidak ditemukan"
            description="Coba kata kunci lain atau hapus pencarian untuk melihat semua modul."
          />
        ) : (
          GROUP_ORDER.map((group) => {
            const items = filtered.filter((module) => module.group === group);
            if (items.length === 0) return null;
            return (
              <View key={group} style={styles.group}>
                <SectionHeading
                  label={group}
                  right={
                    <Text style={styles.groupCount}>{items.length} modul</Text>
                  }
                />
                <Surface style={styles.listCard} padding={0}>
                  {items.map((module, index) => (
                    <ModuleRow
                      key={module.path}
                      module={module}
                      last={index === items.length - 1}
                      onPress={() => router.push(module.href)}
                    />
                  ))}
                </Surface>
              </View>
            );
          })
        )}

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>PUSKESMAS</Text>
          <Text style={styles.footerText}>
            Modul disusun berdasarkan alur layanan pasien: daftar → antre → periksa →
            obat → bayar → laporan.
          </Text>
        </View>
      </View>
    </AppPage>
  );
}

function ModuleRow({
  module,
  last,
  onPress,
}: {
  module: ModuleLink;
  last: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Buka ${module.label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.moduleRow,
        !last && styles.moduleRowBorder,
        pressed && { backgroundColor: colors.canvasDeep },
      ]}
    >
      <View style={[styles.moduleIcon, { backgroundColor: module.tint }]}>
        <Ionicons name={module.icon} size={17} color={module.color} />
      </View>
      <View style={styles.moduleCopy}>
        <Text style={styles.moduleTitle}>{module.label}</Text>
        <Text style={styles.moduleDescription} numberOfLines={2}>
          {module.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.mutedSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    paddingTop: 4,
  },
  identityCard: {
    overflow: 'hidden',
    padding: 16,
    gap: 4,
    borderRadius: radius.lg,
  },
  identityDecor: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -50,
    top: -60,
    backgroundColor: 'rgba(15, 118, 110, 0.25)',
  },
  identityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  identityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
  },
  identityNote: {
    fontSize: 10.5,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.55)',
    maxWidth: 380,
  },
  group: {
    gap: 9,
  },
  groupCount: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
  },
  listCard: {
    overflow: 'hidden',
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  moduleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  moduleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleCopy: {
    flex: 1,
    gap: 1,
  },
  moduleTitle: {
    ...type.bodyStrong,
    fontSize: 13,
  },
  moduleDescription: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    gap: 3,
  },
  footerTitle: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.mutedSoft,
  },
  footerText: {
    fontSize: 8.5,
    lineHeight: 13,
    textAlign: 'center',
    color: colors.mutedSoft,
    maxWidth: 340,
  },
});
