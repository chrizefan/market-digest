import Image from 'next/image';

export default function AtlasLoader(props: { fullScreen?: boolean }) {
  const { fullScreen = true } = props;
  // NOTE: Next config sets `basePath: '/digiquant-atlas'` (static export).
  // Static assets must be prefixed with basePath to avoid 404s.
  const basePath = '/digiquant-atlas';

  return (
    <div className={fullScreen ? 'atlas-loader-screen' : 'atlas-loader-inline'}>
      <div className="atlas-loader">
        <div className="atlas-loader-orbit" aria-hidden="true" />
        <div className="atlas-loader-orbit atlas-loader-orbit-2" aria-hidden="true" />
        <div className="atlas-loader-logo" aria-hidden="true">
          <Image src={`${basePath}/favicon.svg`} alt="" width={56} height={56} priority />
        </div>
      </div>
    </div>
  );
}

