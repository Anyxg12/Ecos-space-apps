import type { ImageAsset } from '../types';

/**
 * Imagen con transparencia automática: si `aiGenerated` es true, añade la marca visible
 * «Imagen generada con IA» (esquina inferior izquierda, dentro de la imagen, sin tapar controles).
 */
export function AssetImage({ asset, className = '' }: { asset: ImageAsset; className?: string }) {
  return (
    <figure className={`ml-asset ${className}`}>
      <img src={asset.src} alt={asset.alt} loading="lazy" decoding="async" />
      {asset.aiGenerated && (
        <span className="ml-ai-mark" lang="es">
          Imagen generada con IA
        </span>
      )}
      {asset.credit && <figcaption className="ml-asset__credit">{asset.credit}</figcaption>}
    </figure>
  );
}
