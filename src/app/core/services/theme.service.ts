import {
  Injectable,
  Inject,
  PLATFORM_ID,
  Renderer2,
  RendererFactory2,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

const STORAGE_KEY = 'PowerSense-dark-mode';
const DARK_MODE_CLASS = 'dark-mode';
const TRANSITION_CLASS = 'theme-transition';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private darkMode$ = new BehaviorSubject<boolean>(false);
  private isBrowser: boolean;
  private renderer: Renderer2;
  private transitionDuration = 300;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    rendererFactory: RendererFactory2
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.renderer = rendererFactory.createRenderer(null, null);

    if (this.isBrowser) {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;

      const storedPreference = this.readFromStorage();
      const initialDarkMode =
        storedPreference !== null ? storedPreference : prefersDark;

      this.darkMode$.next(initialDarkMode);
      this.applyTheme(initialDarkMode);

      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (this.readFromStorage() === null) {
            this.setDark(e.matches);
          }
        });

      this.addGlobalTransitionStyles();
    }
  }

  themeChanges(): Observable<boolean> {
    return this.darkMode$.asObservable();
  }

  isDark(): boolean {
    return this.darkMode$.value;
  }

  setDark(isDark: boolean): void {
    if (this.isBrowser) {
      document.body.classList.add(TRANSITION_CLASS);

      setTimeout(() => {
        this.darkMode$.next(isDark);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(isDark));
        this.applyTheme(isDark);

        setTimeout(() => {
          document.body.classList.remove(TRANSITION_CLASS);
        }, this.transitionDuration);
      }, 10);
    }
  }

  initTheme(): void {
    if (this.isBrowser) {
      const darkMode = this.readFromStorage();
      if (darkMode !== null) {
        this.setDark(darkMode);
      }
    }
  }
  toggleTheme(): void {
    this.setDark(!this.isDark());
  }

  private readFromStorage(): boolean | null {
    if (!this.isBrowser) return null;

    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  private applyTheme(isDark: boolean) {
    if (!this.isBrowser) return;

    const body = document.body;

    if (isDark) {
      body.classList.add(DARK_MODE_CLASS);
    } else {
      body.classList.remove(DARK_MODE_CLASS);
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#377519' : '#61d222');
    }
  }

  private addGlobalTransitionStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .theme-transition,
      .theme-transition *,
      .theme-transition *:before,
      .theme-transition *:after {
        transition: all ${this.transitionDuration}ms ease !important;
        transition-delay: 0 !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
}
