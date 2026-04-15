import Image from 'next/image';

export default function AtlasLoader(props: { label?: string; fullScreen?: boolean }) {
  const { label = 'Loading…', fullScreen = true } = props;

  return (
    <div className={fullScreen ? 'atlas-loader-screen' : 'atlas-loader-inline'}>
      <div className="atlas-loader">
        <div className="atlas-loader-orbit" aria-hidden="true" />
        <div className="atlas-loader-orbit atlas-loader-orbit-2" aria-hidden="true" />
        <div className="atlas-loader-logo" aria-hidden="true">
          <Image src="/favicon.svg" alt="" width={56} height={56} priority />
        </div>
      </div>
      <div className="atlas-loader-label">{label}</div>
    </div>
  );
}

