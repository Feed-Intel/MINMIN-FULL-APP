import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";

type DatePicketProps = {
  dateFilterVisible: boolean;
  setDateFilterVisible: (visible: boolean) => void;
  selectedDate: any;
  setSelectedDate: (date: any) => void;
};

const calendarTheme = {
  backgroundColor: "#ffffff",
  calendarBackground: "#ffffff",
  textSectionTitleColor: "#4CAF50",
  selectedDayBackgroundColor: "#4CAF50",
  selectedDayTextColor: "#ffffff",
  todayTextColor: "#4CAF50",
  dayTextColor: "#2d4150",
  textDisabledColor: "#d9e1e8",
  dotColor: "#4CAF50",
  selectedDotColor: "#ffffff",
  arrowColor: "#4CAF50",
  monthTextColor: "#4CAF50",
  indicatorColor: "#4CAF50",
  textDayFontFamily: "monospace",
  textMonthFontFamily: "monospace",
  textDayHeaderFontFamily: "monospace",
  textDayFontWeight: "300",
  textMonthFontWeight: "bold",
  textDayHeaderFontWeight: "300",
  textDayFontSize: 14,
  textMonthFontSize: 16,
  textDayHeaderFontSize: 14,
};
export default function DatePicker({
  dateFilterVisible,
  setDateFilterVisible,
  selectedDate,
  setSelectedDate,
}: DatePicketProps) {
  return (
    <Modal visible={dateFilterVisible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={() => setDateFilterVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Calendar
            theme={calendarTheme}
            current={selectedDate}
            minDate={"2020-01-01"}
            maxDate={moment().format("YYYY-MM-DD")}
            onDayPress={(day: any) => {
              setSelectedDate(day.dateString);
              setDateFilterVisible(false);
            }}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: "#4CAF50" },
            }}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setDateFilterVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  cancelButton: {
    backgroundColor: "#FF5252",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
