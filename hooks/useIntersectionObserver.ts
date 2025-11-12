import { useState, useEffect, RefObject } from 'react';

interface IntersectionObserverOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

/**
 * Хук для отслеживания видимости элемента в области просмотра.
 * @param elementRef Ref на отслеживаемый HTML-элемент.
 * @param options Опции для IntersectionObserver.
 * @returns `true`, если элемент виден, иначе `false`.
 */
export const useIntersectionObserver = <T extends Element>(
  elementRef: RefObject<T>,
  {
    threshold = 0.1,
    root = null,
    rootMargin = '0%',
    triggerOnce = true,
  }: IntersectionObserverOptions = {}
): boolean => {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    
    // Если элемента нет, ничего не делаем
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Если пересечение есть и нужно сработать один раз,
        // обновляем состояние и отписываемся.
        if (entry.isIntersecting && triggerOnce) {
          setIntersecting(true);
          observer.unobserve(element);
        } 
        // Если нужно отслеживать постоянно, просто обновляем состояние.
        else if (!triggerOnce) {
          setIntersecting(entry.isIntersecting);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);

    // Отключаем наблюдение при размонтировании компонента
    return () => {
      observer.disconnect();
    };
    // Перезапускаем эффект, только если сам элемент или опции изменились.
  }, [elementRef, root, rootMargin, threshold, triggerOnce]);

  return isIntersecting;
};
