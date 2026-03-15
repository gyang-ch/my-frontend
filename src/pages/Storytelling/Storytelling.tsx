import React, { useEffect, useRef, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Storytelling.css';

gsap.registerPlugin(ScrollTrigger);

const pageLinks = [
  "https://ids.lib.harvard.edu/ids/iiif/53989665/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53990376/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989201/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989206/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53990633/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989251/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989872/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53990783/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53990182/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989073/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53990032/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989057/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53990655/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989587/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989771/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989969/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989666/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989762/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989667/info.json",
  "https://ids.lib.harvard.edu/ids/iiif/53989704/info.json"
];

const VERTICAL_GAP = 1.5;
const stackedTileSources = pageLinks.map((url, index) => ({
  tileSource: url,
  x: 0,
  y: index * VERTICAL_GAP,
  width: 1
}));

const annotations: Record<string, { page: number; rect: { x: number; y: number; width: number; height: number } }> = {
  "title_zoom": { page: 0, rect: { x: 0.55, y: 0.1, width: 0.35, height: 0.6 } },
  "center_zoom": { page: 1, rect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 } },
  "bottom_right": { page: 2, rect: { x: 0.4, y: 0.5, width: 0.4, height: 0.4 } },
  "top_left": { page: 6, rect: { x: 0.1, y: 0.1, width: 0.3, height: 0.3 } }
};

const expandRect = (rect: { x: number; y: number; width: number; height: number }, factor: number) => {
  const width = rect.width * factor;
  const height = rect.height * factor;
  const x = rect.x - (width - rect.width) / 2;
  const y = rect.y - (height - rect.height) / 2;
  return new OpenSeadragon.Rect(x, y, width, height);
};

export const Storytelling: React.FC = () => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const osdRef = useRef<OpenSeadragon.Viewer | null>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    // Initialize OpenSeadragon
    const viewer = OpenSeadragon({
      element: viewerRef.current,
      // prefixUrl is optional if we don't need default icons, but providing a safe fallback is good
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
      tileSources: stackedTileSources as any,
      showNavigationControl: false,
      mouseNavEnabled: false,
      panVertical: true,
      animationTime: 1.2,
      springStiffness: 10,
      imageLoaderLimit: 15,
      immediateRender: true,
      preload: true,
      minZoomImageRatio: 1
    });

    osdRef.current = viewer;

    const handleOpen = () => {
      viewer.viewport.fitBounds(new OpenSeadragon.Rect(0, 0, 1, 1.4), true);

      // Setup GSAP context for cleanup
      ctxRef.current = gsap.context(() => {
        const steps = gsap.utils.toArray<HTMLElement>('.story-step');

        steps.forEach((step, index) => {
          const content = step.querySelector('.step-content');
          const elementsToAnimate = step.querySelectorAll('h2, p');
          
          // Initial state
          if (content) gsap.set(content, { opacity: 0, x: -30 });
          if (elementsToAnimate.length) gsap.set(elementsToAnimate, { opacity: 0, y: 20 });

          ScrollTrigger.create({
            trigger: step,
            scroller: scrollContainerRef.current,
            start: "center center",
            onEnter: () => {
              activateStep(step, index);
              if (content) gsap.to(content, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" });
              if (elementsToAnimate.length) gsap.to(elementsToAnimate, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "power3.out", delay: 0.2 });
            },
            onEnterBack: () => {
              activateStep(step, index);
              if (content) gsap.to(content, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" });
              if (elementsToAnimate.length) gsap.to(elementsToAnimate, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "power3.out", delay: 0.2 });
            },
            onLeave: () => {
              if (content) gsap.to(content, { opacity: 0, x: -30, duration: 0.4 });
              if (elementsToAnimate.length) gsap.to(elementsToAnimate, { opacity: 0, y: 20, duration: 0.4 });
            },
            onLeaveBack: () => {
              if (content) gsap.to(content, { opacity: 0, x: -30, duration: 0.4 });
              if (elementsToAnimate.length) gsap.to(elementsToAnimate, { opacity: 0, y: 20, duration: 0.4 });
            }
          });
        });
      }, scrollContainerRef);
    };

    viewer.addHandler('open', handleOpen);

    const activateStep = (element: HTMLElement, index: number) => {
      setActiveStep(index);
      
      const targetPage = parseInt(element.dataset.page || "0", 10);
      const annoId = element.dataset.annotation;
      const action = element.dataset.action;

      viewer.clearOverlays();

      if (annoId && annotations[annoId]) {
        const anno = annotations[annoId];
        const globalRect = new OpenSeadragon.Rect(
          anno.rect.x,
          (anno.page * VERTICAL_GAP) + anno.rect.y,
          anno.rect.width,
          anno.rect.height
        );

        const box = document.createElement("div");
        box.className = "annotation-box";
        box.style.display = "block";
        viewer.addOverlay({ element: box, location: globalRect });

        const cameraRect = expandRect(globalRect, 1.3);
        viewer.viewport.fitBounds(cameraRect, false);
      } else if (action === "overview") {
        const pageRect = new OpenSeadragon.Rect(0, targetPage * VERTICAL_GAP, 1, 1.4);
        viewer.viewport.fitBounds(pageRect, false);
      }
    };

    return () => {
      if (ctxRef.current) ctxRef.current.revert();
      viewer.destroy();
    };
  }, []);

  const storySteps = [
    { page: 0, action: "overview", title: "The Heavens Observed", text: "Welcome to this continuous scroll experience. Because of the scroll-snap logic, you can easily control the pace of the narrative without accidentally skipping images." },
    { page: 0, annotation: "title_zoom", title: "The Calligraphy", text: "We remain on the first page, but GSAP commands OpenSeadragon to zoom precisely into the title block. Notice the ink details." },
    { page: 1, action: "overview", title: "The Armillary Sphere", text: "Scrolling down pulls the next page up from the bottom of the canvas smoothly." },
    { page: 1, annotation: "center_zoom", title: "Intricate Rings", text: "The camera swoops into the dense interlocking rings of the sphere." },
    { page: 2, action: "overview", title: "A Second Instrument", text: "Sliding down further, another immense bronze instrument is detailed. These original instruments still stand today in Beijing." },
    { page: 2, annotation: "bottom_right", title: "Dragon Mounts", text: "Notice the intricate base. The heavy bronze rings were supported by ornately cast dragons, a symbol of imperial authority." },
    { page: 3, action: "overview", title: "The Celestial Globe", text: "This diagram shows a celestial globe. The stars were mapped onto a massive bronze sphere." },
    { page: 4, action: "overview", title: "The Quadrant", text: "Verbiest designed these tools to be massive—sometimes weighing several tons—to increase measuring precision." },
    { page: 5, action: "overview", title: "Sextant Design", text: "Here is the great sextant. Because we adjusted the imageLoaderLimit, these massive pages stream much faster." },
    { page: 6, annotation: "top_left", title: "Pulleys and Gears", text: "Zooming into the upper corner reveals the mechanical winding systems required to move the heavy viewing sights." },
    { page: 19, action: "overview", title: "The Final Diagram", text: "We arrive at the bottom of our vertical column. Thank you for exploring Ferdinand Verbiest's universe." }
  ];

  return (
    <div className="storytelling-wrapper">
      <div id="osd-viewer" ref={viewerRef}></div>
      <div id="scroll-container" ref={scrollContainerRef}>
        {storySteps.map((step, index) => (
          <div 
            key={index} 
            className={`story-step ${activeStep === index ? 'is-active' : ''}`}
            data-page={step.page}
            data-action={step.action}
            data-annotation={step.annotation}
          >
            <div className="step-content">
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};