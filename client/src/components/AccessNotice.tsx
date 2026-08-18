import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { KeyRound, RefreshCw } from "lucide-react";

export function AccessNotice() {
  return <section className="empty-state slim access-notice"><span className="empty-state-icon"><KeyRound className="h-6 w-6" /></span><p className="eyebrow">ESPACIO PERSONAL</p><h2>Inicia sesión para ver tus proyectos.</h2><p>Tu tablero guarda categorías, notas y progreso asociados a tu cuenta.</p><Button className="primary-action" onClick={() => startLogin()}><KeyRound className="h-4 w-4" />Iniciar sesión</Button></section>;
}

export function QueryErrorNotice({ onRetry }: { onRetry: () => void }) {
  return <section className="empty-state slim"><span className="empty-state-icon"><RefreshCw className="h-6 w-6" /></span><p className="eyebrow">NO PUDIMOS CARGAR EL ESPACIO</p><h2>Algo interrumpió la consulta.</h2><p>Comprueba tu conexión y vuelve a intentarlo. Tus datos no se han modificado.</p><Button className="secondary-action" onClick={onRetry}><RefreshCw className="h-4 w-4" />Reintentar</Button></section>;
}
