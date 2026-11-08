import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { hasAccess, roleMeta } from '@/core/navigation';
import { colors, radius, type } from '@/core/theme';
import { AccessDenied } from '@/components/layout/access-denied';
import { AppPage } from '@/components/layout/app-page';
import { PageHeading } from '@/components/layout/page-heading';
import { SectionHeading } from '@/components/layout/section-heading';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { ChoicePills } from '@/components/ui/choice-pills';
import { EmptyNote } from '@/components/ui/empty-note';
import { IconButton } from '@/components/ui/icon-button';
import { MetricTile } from '@/components/ui/metric-tile';
import { SearchField } from '@/components/ui/search-field';
import { Surface } from '@/components/ui/surface';
import { Tag } from '@/components/ui/tag';
import { useAuth } from '@/features/auth/auth-provider';
import { useClinic } from '@/features/clinic/clinic-provider';
import { clinicInfo } from '@/features/clinic/selectors';
import { STAFF_ROLES, type Staff, type StaffRole } from '@/features/clinic/types';

type RoleFilter = 'all' | StaffRole;

export default function UsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { staff, actions } = useClinic();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  if (!user) return null;
  if (!hasAccess(user.role, '/pengguna')) {
    return <AccessDenied required="administrator" />;
  }

  const activeCount = staff.filter((member) => member.active).length;
  const inactiveCount = staff.length - activeCount;
  const roleOrder = new Map(STAFF_ROLES.map((role, index) => [role, index]));
  const filteredStaff = staff
    .filter((member) => {
      const matchesRole =
        roleFilter === 'all' || member.role === roleFilter;
      if (!matchesRole) return false;
      const haystack = `${member.name} ${member.username} ${roleMeta[member.role].label}`;
      return haystack.toLowerCase().includes(query.trim().toLowerCase());
    })
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const roleDiff =
        (roleOrder.get(a.role) ?? 9) - (roleOrder.get(b.role) ?? 9);
      if (roleDiff !== 0) return roleDiff;
      return a.name.localeCompare(b.name);
    });

  const roleOptions: {
    value: RoleFilter;
    label: string;
    count: number;
  }[] = [
    { value: 'all', label: 'Semua', count: staff.length },
    ...STAFF_ROLES.map((role) => ({
      value: role as RoleFilter,
      label: roleMeta[role].short,
      count: staff.filter((member) => member.role === role).length,
    })),
  ];

  const toggleActive = (member: Staff, next: boolean) => {
    if (member.id === user.id) return;
    if (!next) {
      Alert.alert(
        'Nonaktifkan akun?',
        `${member.name} tidak akan dapat masuk ke aplikasi sampai akun diaktifkan kembali.`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Nonaktifkan',
            style: 'destructive',
            onPress: () => actions.setStaffActive(member.id, false),
          },
        ],
      );
      return;
    }
    actions.setStaffActive(member.id, true);
  };

  const resetPassword = (member: Staff) => {
    Alert.alert(
      'Reset kata sandi',
      `Kata sandi ${member.name} akan direset menjadi "sehat123". Pengguna harus menggantinya setelah masuk.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const password = actions.resetStaffPassword(member.id);
            if (!password) {
              Alert.alert('Gagal', 'Akun tidak ditemukan.');
              return;
            }
            Alert.alert(
              'Kata sandi sementara',
              `${member.name}\nNama pengguna: ${member.username}\nKata sandi: ${password}`,
              [{ text: 'Mengerti' }],
            );
          },
        },
      ],
    );
  };

  return (
    <AppPage
      dock
      headerRight={
        <IconButton
          icon="person-add-outline"
          label="Tambah pengguna"
          variant="quiet"
          size={38}
          onPress={() => router.push('/pengguna/tambah')}
        />
      }
    >
      <View style={styles.container}>
        <PageHeading
          eyebrow="Manajemen akses"
          title="Pengguna"
          description="Kelola akun staf, peran, dan status akses. Perubahan langsung berlaku pada sesi demo."
          right={<Tag label={`${activeCount} aktif`} tone="green" dot />}
        />

        <View style={styles.metrics}>
          <MetricTile
            label="Akun"
            value={String(staff.length)}
            hint="total staf"
          />
          <MetricTile
            label="Aktif"
            value={String(activeCount)}
            hint="dapat masuk"
            tone="teal"
          />
          <MetricTile
            label="Nonaktif"
            value={String(inactiveCount)}
            hint="akses ditutup"
            tone={inactiveCount > 0 ? 'rose' : 'paper'}
          />
        </View>

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Cari nama, nama pengguna, atau peran…"
        />

        <ChoicePills
          options={roleOptions}
          value={roleFilter}
          onChange={setRoleFilter}
          scroll
        />

        <View style={styles.listSection}>
          <SectionHeading
            label="Daftar akun"
            right={
              <Text style={styles.countLabel}>
                {filteredStaff.length} pengguna
              </Text>
            }
          />
          {filteredStaff.length === 0 ? (
            <EmptyNote
              icon="people-outline"
              title="Tidak ada pengguna yang cocok"
              description="Ubah pencarian atau filter peran untuk melihat akun lain."
            />
          ) : (
            <View style={styles.cardList}>
              {filteredStaff.map((member) => {
                const meta = roleMeta[member.role];
                const isSelf = member.id === user.id;
                return (
                  <Surface
                    key={member.id}
                    padding={12}
                    style={[
                      styles.card,
                      !member.active && styles.cardInactive,
                    ]}
                  >
                    <View style={styles.cardTop}>
                      <Avatar
                        name={member.name}
                        size={44}
                        color={meta.color}
                        tint={meta.tint}
                      />
                      <View style={styles.cardIdentity}>
                        <View style={styles.nameRow}>
                          <Text style={styles.name} numberOfLines={1}>
                            {member.name}
                          </Text>
                          {isSelf ? <Tag label="Anda" tone="ink" /> : null}
                        </View>
                        <Text style={styles.username}>@{member.username}</Text>
                        <View style={styles.metaRow}>
                          <Tag
                            label={meta.label}
                            tone="neutral"
                            icon={meta.icon}
                          />
                          {member.clinic ? (
                            <Tag
                              label={clinicInfo[member.clinic].short}
                              tone="teal"
                            />
                          ) : null}
                        </View>
                      </View>
                      <View style={styles.switchBlock}>
                        <Switch
                          value={member.active}
                          onValueChange={(value) =>
                            toggleActive(member, value)
                          }
                          disabled={isSelf}
                          accessibilityLabel={`Status akses ${member.name}`}
                          trackColor={{
                            false: colors.canvasDeep,
                            true: colors.tealSoft,
                          }}
                          thumbColor={
                            member.active ? colors.teal : colors.mutedSoft
                          }
                          ios_backgroundColor={colors.canvasDeep}
                        />
                        <Text style={styles.switchLabel}>
                          {member.active ? 'Aktif' : 'Nonaktif'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Tag
                        label={member.active ? 'Dapat masuk' : 'Akses ditutup'}
                        tone={member.active ? 'green' : 'rose'}
                        dot
                      />
                      {isSelf ? (
                        <Text style={styles.selfNote}>
                          Akun Anda tidak dapat dinonaktifkan
                        </Text>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Reset kata sandi ${member.name}`}
                          onPress={() => resetPassword(member)}
                          style={({ pressed }) => [
                            styles.resetButton,
                            pressed && { opacity: 0.65 },
                          ]}
                        >
                          <Ionicons
                            name="key-outline"
                            size={13}
                            color={colors.inkMuted}
                          />
                          <Text style={styles.resetText}>Reset sandi</Text>
                        </Pressable>
                      )}
                    </View>
                  </Surface>
                );
              })}
            </View>
          )}
        </View>

        <ActionButton
          label="Tambah akun pengguna"
          icon="person-add-outline"
          tone="teal"
          onPress={() => router.push('/pengguna/tambah')}
          fullWidth
        />

        <Text style={styles.footer}>
          Akun nonaktif tetap tampil pada daftar, tetapi tidak dapat masuk.
          Kata sandi tersimpan lokal dan direset menjadi sehat123.
        </Text>
      </View>
    </AppPage>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 4,
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
  },
  listSection: {
    gap: 9,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
  },
  cardList: {
    gap: 9,
  },
  card: {
    gap: 10,
  },
  cardInactive: {
    backgroundColor: colors.paperWarm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIdentity: {
    flex: 1,
    gap: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    ...type.bodyStrong,
    fontSize: 12.5,
    flexShrink: 1,
  },
  username: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  switchBlock: {
    alignItems: 'center',
    gap: 1,
  },
  switchLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  selfNote: {
    fontSize: 8,
    color: colors.mutedSoft,
    fontStyle: 'italic',
    flexShrink: 1,
    textAlign: 'right',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  resetText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  footer: {
    textAlign: 'center',
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.mutedSoft,
    paddingTop: 2,
  },
});
