import Home from "@/pages/Home";
import { Route, Switch } from "wouter";

export default function App() {
  return <Switch><Route path="/" component={Home} /><Route component={Home} /></Switch>;
}
