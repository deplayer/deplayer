import BodyMessage from "./BodyMessage";

export default function NotFound({ children }: { children: React.ReactNode }) {
  return <BodyMessage message={children}></BodyMessage>;
}
