import { ReactNode } from "react";

export default function ForecastAccuracyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section className="w-full h-full">
     
      {/* <div className="mb-4">
        <h1 className="text-xl font-semibold">
          Forecast Accuracy
        </h1>
        <p className="text-sm text-muted-foreground">
          Performance & accuracy monitoring
        </p>
      </div> */}

      {/* Content Wrapper */}
      <div>
        {children}
      </div>
    </section>
  );
}
