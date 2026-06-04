import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { colors, SECTORS } from '../utils';

interface AddGreenhouseModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, sector: string) => void;
}

export const AddGreenhouseModal: React.FC<AddGreenhouseModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const [name, setName] = React.useState('');
  const [sector, setSector] = React.useState(SECTORS[0]);

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name, sector);
      setName('');
      setSector(SECTORS[0]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalOverlay} />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adicionar Nova Estufa</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={colors.zinc[400]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome da Estufa</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Estufa Delta"
                placeholderTextColor={colors.zinc[500]}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Setor</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
              >
                {SECTORS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.sectorButton,
                      sector === s && {
                        backgroundColor: colors.emerald,
                      },
                    ]}
                    onPress={() => setSector(s)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.sectorButtonText,
                        sector === s && { color: 'black' },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreate}
              activeOpacity={0.7}
            >
              <Plus size={16} color="black" />
              <Text style={styles.createButtonText}>Criar Estufa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    backgroundColor: colors.darkSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderWidth: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.zinc[900],
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.3,
  },
  modalForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.zinc[300],
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.zinc[900],
    color: 'white',
    fontSize: 12,
  },
  sectorButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.zinc[900],
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.zinc[800],
  },
  sectorButtonText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.zinc[400],
  },
  createButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.emerald,
    borderRadius: 10,
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'black',
    letterSpacing: 0.2,
  },
});
