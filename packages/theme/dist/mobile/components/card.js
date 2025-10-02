"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
function Card({ children, style }) {
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { className: "bg-surface rounded-2xl p-4", style: [
            {
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowOffset: { width: 0, height: 6 },
                shadowRadius: 10,
                elevation: 4,
                backgroundColor: '#ffffff',
            },
            style,
        ], children: children }));
}
