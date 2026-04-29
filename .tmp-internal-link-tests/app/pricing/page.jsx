"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PricingPage;
const react_1 = require("react");
const pricing_content_1 = __importDefault(require("./pricing-content"));
function PricingPage() {
    return (<react_1.Suspense fallback={null}>
      <pricing_content_1.default />
    </react_1.Suspense>);
}
