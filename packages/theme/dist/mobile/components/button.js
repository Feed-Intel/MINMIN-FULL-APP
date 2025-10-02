"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
function Button({ title, onPress, tone = 'primary' }) {
    const background = tone === 'primary' ? '#73b661' : '#ffb72b';
    const textColor = '#ffffff';
    return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: onPress, className: "h-12 px-5 rounded-2xl items-center justify-center", style: { backgroundColor: background }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { className: "font-medium", style: { color: textColor }, children: title }) }));
}
