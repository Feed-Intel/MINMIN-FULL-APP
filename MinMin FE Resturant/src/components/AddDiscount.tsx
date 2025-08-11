import dayjs from "dayjs";
import DatePicker from "@/components/DatePicker";
import { Branch } from "@/types/branchType";
import { useState } from "react";
import { useCreateDiscount } from "@/services/mutation/discountMutation";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { Button, Dialog, Menu, Portal, Switch } from "react-native-paper";
import { ScrollView, View, TextInput, Text, StyleSheet } from "react-native";

type AddDiscountModalProps = {
  branches: Branch[];
  visible: boolean;
  onClose: () => void;
};

const TYPEOPTIONS = [
  { label: "Volume", value: "volume" },
  { label: "Combo", value: "combo" },
  { label: "BOGO", value: "bogo" },
  { label: "Free Item", value: "freeItem" },
];

export default function AddDiscountModal({
  branches,
  visible,
  onClose,
}: AddDiscountModalProps) {
  const [branch, setBranch] = useState<string>("");
  const [applyToAllBranches, setApplyToAllBranches] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [showType, setShowType] = useState(false);
  const [off_peak_hours, setOffPeakHours] = useState(false);
  const [priority, setPriority] = useState<string | undefined>(undefined);
  const [stackable, setStackable] = useState(false);
  const [valid_from, setValidFrom] = useState<Date | undefined>(undefined);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [valid_until, setValidUntil] = useState<Date | undefined>(undefined);
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const { mutateAsync: onAdd } = useCreateDiscount();
  const queryClient = useQueryClient();

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Validate Branch
    if (!applyToAllBranches && !branch) {
      Toast.show({
        type: "error",
        text1: "Branch selection is required.",
        text2: "Please Select Branch",
      });
      return false;
    }

    // Validate Name
    if (!name?.trim()) {
      Toast.show({
        type: "error",
        text1: "Name is required.",
      });
      return false;
    } else if (name.trim().length < 3) {
      Toast.show({
        type: "error",
        text1: "Name must be at least 3 characters long.",
      });
      return false;
    }

    // Validate Type
    if (!type) {
      Toast.show({ type: "error", text1: "Discount type is required." });
      return false;
    }

    // Validate Priority
    if (priority !== undefined) {
      if (isNaN(Number(priority)) || Number(priority) < 0) {
        Toast.show({
          type: "error",
          text1: "Priority must be a non-negative number.",
        });
        return false;
      }
    }

    // Validate Valid From/Until Dates
    if (!valid_from) {
      Toast.show({ type: "error", text1: "Valid From date is required." });
      return false;
    }
    if (!valid_until) {
      Toast.show({ type: "error", text1: "Valid Until date is required." });
      return false;
    } else if (dayjs(valid_until).isBefore(valid_from)) {
      Toast.show({
        type: "error",
        text1: "Valid Until must be after Valid From.",
      });
      return false;
    }

    return true;
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={stylesModal.dialog}>
        <Dialog.Content>
          <ScrollView>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Text style={{ color: "#40392B" }}>Apply to all branches</Text>
              <Switch
                value={applyToAllBranches}
                onValueChange={setApplyToAllBranches}
                color="#91B275"
              />
            </View>
            {!applyToAllBranches && (
              <Menu
                visible={showMenu}
                onDismiss={() => setShowMenu(false)}
                anchor={
                  <Button
                    mode="outlined"
                    style={stylesModal.dropdownBtn}
                    labelStyle={{
                      color: branch === "" ? "#aaa" : "#333",
                      fontSize: 14,
                      width: "100%",
                      textAlign: "left",
                      marginLeft: 0,
                    }}
                    onPress={() => setShowMenu(true)}
                    contentStyle={{
                      flexDirection: "row-reverse",
                      width: "100%",
                      paddingLeft: 10,
                    }}
                    icon={showMenu ? "chevron-up" : "chevron-down"}
                  >
                    {branch
                      ? branches.find((b: any) => b.id === branch)?.address
                      : "Branch"}
                  </Button>
                }
                contentStyle={[stylesModal.menuContainer, { width: "100%" }]} // custom menu style
                style={{ alignSelf: "stretch" }} // Make it align with the anchor width
                anchorPosition="bottom"
              >
                {branches.length > 0 ? (
                  branches.map((b: any) => (
                    <Menu.Item
                      key={b.id}
                      onPress={() => {
                        setBranch(b.id!);
                        setShowMenu(false);
                      }}
                      title={b.address}
                      titleStyle={stylesModal.menuItem}
                    />
                  ))
                ) : (
                  <Menu.Item title="No branches available" disabled />
                )}
              </Menu>
            )}
            <TextInput
              placeholder="Name"
              value={name}
              onChangeText={setName}
              style={stylesModal.input}
              placeholderTextColor="#999"
            />

            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={stylesModal.input}
              keyboardType="default"
              placeholderTextColor="#999"
            />

            <Menu
              visible={showType}
              onDismiss={() => setShowMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  style={stylesModal.dropdownBtn}
                  labelStyle={{
                    color: type === "" ? "#aaa" : "#333",
                    fontSize: 14,
                    width: "100%",
                    textAlign: "left",
                    marginLeft: 0,
                  }}
                  onPress={() => setShowType(true)}
                  contentStyle={{
                    flexDirection: "row-reverse",
                    width: "100%",
                    paddingLeft: 10,
                  }}
                  icon={showType ? "chevron-up" : "chevron-down"}
                >
                  {type
                    ? TYPEOPTIONS.find((t: any) => t.value === type)?.value
                    : "Type"}
                </Button>
              }
              contentStyle={[stylesModal.menuContainer, { width: "100%" }]} // custom menu style
              style={{ alignSelf: "stretch" }} // Make it align with the anchor width
              anchorPosition="bottom"
            >
              {TYPEOPTIONS.map((t: any) => (
                <Menu.Item
                  key={t}
                  onPress={() => {
                    setType(t.value!);
                    setShowMenu(false);
                  }}
                  title={t.label}
                  titleStyle={stylesModal.menuItem}
                />
              ))}
            </Menu>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Text style={{ color: "#40392B" }}>Off-Peak Hours</Text>
              <Switch
                value={off_peak_hours}
                onValueChange={setOffPeakHours}
                color="#91B275"
              />
            </View>
            <TextInput
              placeholder="Priority"
              value={priority?.toString() || ""}
              onChangeText={setPriority}
              style={stylesModal.input}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Text style={{ color: "#40392B" }}>Stackable</Text>
              <Switch
                value={stackable}
                onValueChange={setStackable}
                color="#91B275"
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 15,
              }}
            >
              <>
                <Button
                  onPress={() => setShowFromPicker(true)}
                  mode="outlined"
                  style={stylesModal.dateButton}
                  contentStyle={{
                    flexDirection: "row-reverse",
                  }}
                  labelStyle={{
                    color: "#22281B",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  icon={"chevron-down"}
                >
                  Valid From:{" "}
                  {valid_from
                    ? dayjs(valid_from).format("YYYY-MM-DD")
                    : "Not Set"}
                </Button>
                <DatePicker
                  dateFilterVisible={showFromPicker}
                  setDateFilterVisible={setShowFromPicker}
                  selectedDate={valid_from}
                  setSelectedDate={setValidFrom}
                />
              </>
              <>
                <Button
                  onPress={() => setShowUntilPicker(true)}
                  mode="outlined"
                  contentStyle={{
                    flexDirection: "row-reverse",
                  }}
                  style={stylesModal.dateButton}
                  labelStyle={{
                    color: "#22281B",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  icon={"chevron-down"}
                >
                  Valid Until:{" "}
                  {valid_until
                    ? dayjs(valid_until).format("YYYY-MM-DD")
                    : "Not Set"}
                </Button>
                <DatePicker
                  dateFilterVisible={showUntilPicker}
                  setDateFilterVisible={setShowUntilPicker}
                  selectedDate={valid_until}
                  setSelectedDate={setValidUntil}
                />
              </>
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            mode="contained"
            style={stylesModal.addButton}
            labelStyle={{ color: "#fff" }}
            onPress={async () => {
              if (validateForm()) {
                await onAdd({
                  branch: branch,
                  all_branch: applyToAllBranches,
                  name: name,
                  description: description,
                  type: type,
                  off_peak_hours: off_peak_hours,
                  priority: priority,
                  is_stackable: stackable,
                  valid_from: valid_from,
                  valid_until: valid_until,
                });
                queryClient.invalidateQueries({ queryKey: ["discounts"] });
                onClose();
              }
            }}
          >
            + Add Discount
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const stylesModal = StyleSheet.create({
  dialog: {
    backgroundColor: "#EFF4EB",
    width: "40%",
    alignSelf: "center",
    borderRadius: 12,
  },
  menuItem: {
    color: "#333",
    fontSize: 14,
  },
  container: {
    marginBottom: 24,
  },
  dropdownBtn: {
    backgroundColor: "#50693A17",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#50693A17",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 15,
    color: "#333",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 5,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: "#333",
  },
  addButton: {
    backgroundColor: "#91B275",
    borderRadius: 30,
  },
  dateButton: {
    marginBottom: 16,
    backgroundColor: "#070D020A",
    borderRadius: 10,
    borderColor: "#5E6E4933",
    flex: 1,
  },
});
