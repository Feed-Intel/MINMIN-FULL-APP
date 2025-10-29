import { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '@/lib/reduxStore/localeSlice';
import { i18n as I18n } from '@/app/_layout';
import { RootState } from '@/lib/reduxStore/store';

export default function LanguageSelector({
  showLanguageModal,
  setShowLanguageModal,
}: {
  showLanguageModal: boolean;
  setShowLanguageModal: (val: boolean) => void;
}) {
  const locale = useSelector((state: RootState) => state.language.locale);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'am'>(
    (locale as 'en' | 'am') || 'am'
  );
  const dispatch = useDispatch();
  const handleChangeLanguage = async (locale: 'en' | 'am') => {
    setSelectedLanguage(locale);
    dispatch(setLanguage(locale));
    setShowLanguageModal(false);
  };
  return (
    <Portal>
      <Dialog
        visible={showLanguageModal}
        onDismiss={() => setShowLanguageModal(false)}
        style={styles.dialog}
      >
        <Dialog.Title>Choose your language</Dialog.Title>
        <Dialog.Content>
          {(['en', 'am'] as const).map((locale) => (
            <TouchableOpacity
              key={locale}
              style={[
                styles.languageOption,
                selectedLanguage === locale && styles.languageOptionActive,
              ]}
              onPress={() => handleChangeLanguage(locale)}
            >
              <Text
                style={[
                  styles.languageOptionLabel,
                  selectedLanguage === locale &&
                    styles.languageOptionLabelActive,
                ]}
              >
                {locale === 'en' ? 'English' : 'አማርኛ'}
              </Text>
            </TouchableOpacity>
          ))}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowLanguageModal(false)}>
            {I18n.t('Common.cancel')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 12,
    backgroundColor: '#EFF4EB',
    width: 500,
    alignSelf: 'center',
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4EDE0',
    marginBottom: 12,
  },
  languageOptionActive: {
    backgroundColor: '#F3F8EF',
    borderColor: '#91B275',
  },
  languageOptionLabel: {
    fontSize: 16,
    color: '#2E3A24',
  },
  languageOptionLabelActive: {
    color: '#3F522E',
    fontWeight: '600',
  },
});
