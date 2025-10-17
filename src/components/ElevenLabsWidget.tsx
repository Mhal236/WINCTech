import { useEffect, useState } from 'react';

interface ElevenLabsWidgetProps {
  enabled?: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'agent-id': string;
      };
    }
  }
}

export function ElevenLabsWidget({ enabled = true }: ElevenLabsWidgetProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    console.log('🤖 ElevenLabs Widget - Enabled:', enabled);
    
    // Only load script if widget is enabled
    if (!enabled) {
      console.log('🤖 ElevenLabs Widget - Disabled, not loading script');
      // Remove existing widget element if present
      const existingWidget = document.querySelector('elevenlabs-convai');
      if (existingWidget) {
        existingWidget.remove();
      }
      return;
    }

    // Check if script is already loaded
    const existingScript = document.querySelector(
      'script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]'
    );

    if (existingScript) {
      console.log('🤖 ElevenLabs Widget - Script already loaded');
      setScriptLoaded(true);
      return;
    }

    console.log('🤖 ElevenLabs Widget - Loading script...');

    // Load the ElevenLabs script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    
    script.onload = () => {
      console.log('✅ ElevenLabs Widget - Script loaded successfully');
      setScriptLoaded(true);
      
      // Wait for widget to render, then hide the phone icon
      setTimeout(() => {
        hidePhoneIcon();
      }, 1000);
    };

    script.onerror = (error) => {
      console.error('❌ ElevenLabs Widget - Script failed to load:', error);
    };

    document.body.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        console.log('🧹 ElevenLabs Widget - Cleaning up script');
        script.parentNode.removeChild(script);
      }
    };
  }, [enabled]);

  // Function to hide phone icon and extra elements in Shadow DOM
  const hidePhoneIcon = () => {
    try {
      const widget = document.querySelector('elevenlabs-convai');
      if (!widget) {
        console.log('⚠️ Widget element not found');
        return;
      }

      // Check if widget has shadow root
      const shadowRoot = (widget as any).shadowRoot;
      if (shadowRoot) {
        console.log('🎯 Found Shadow Root, injecting styles...');
        
        // Check if style already injected
        if (shadowRoot.querySelector('#custom-widget-styles')) {
          console.log('⚠️ Styles already injected, skipping');
          return;
        }
        
        // Inject styles into Shadow DOM
        const style = document.createElement('style');
        style.id = 'custom-widget-styles';
        style.textContent = `
          /* Only hide phone icon SVG inside buttons, keep the button itself */
          button svg[data-icon="phone"],
          button svg[data-testid="phone-icon"],
          button > svg {
            display: none !important;
          }
        `;
        shadowRoot.appendChild(style);
        console.log('✅ Styles injected into Shadow DOM');
      } else {
        console.log('📝 No Shadow Root found, trying regular CSS');
      }
    } catch (error) {
      console.error('❌ Error hiding phone icon:', error);
    }
  };

  // Don't render if not enabled
  if (!enabled) {
    return null;
  }

  console.log('🎨 ElevenLabs Widget - Rendering widget element');

  // Set up mutation observer to detect when widget is fully rendered
  useEffect(() => {
    if (!enabled || !scriptLoaded) return;

    const observer = new MutationObserver(() => {
      hidePhoneIcon();
    });

    const widget = document.querySelector('elevenlabs-convai');
    if (widget) {
      observer.observe(widget, { childList: true, subtree: true });
    }

    // Also try immediately
    hidePhoneIcon();

    return () => observer.disconnect();
  }, [enabled, scriptLoaded]);

  return (
    <elevenlabs-convai 
      agent-id="agent_1201k6e93c2nez08rpwbqf6kcbmp"
    />
  );
}

