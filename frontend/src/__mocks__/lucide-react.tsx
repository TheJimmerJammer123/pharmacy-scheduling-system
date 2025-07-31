import React from 'react';

// Mock all lucide-react icons as simple div elements
const createMockIcon = (name: string) => {
  return React.forwardRef<HTMLDivElement, any>((props, ref) => {
    return React.createElement('div', {
      ref,
      'data-testid': `icon-${name}`,
      ...props,
    });
  });
};

// Export commonly used icons
export const AlertTriangle = createMockIcon('AlertTriangle');
export const RefreshCw = createMockIcon('RefreshCw');
export const Home = createMockIcon('Home');
export const MessageSquare = createMockIcon('MessageSquare');
export const Users = createMockIcon('Users');
export const Settings = createMockIcon('Settings');
export const Menu = createMockIcon('Menu');
export const X = createMockIcon('X');
export const Store = createMockIcon('Store');
export const Calendar = createMockIcon('Calendar');
export const FileText = createMockIcon('FileText');
export const Edit3 = createMockIcon('Edit3');
export const Trash2 = createMockIcon('Trash2');
export const ArrowLeft = createMockIcon('ArrowLeft');
export const ChevronLeft = createMockIcon('ChevronLeft');
export const ChevronRight = createMockIcon('ChevronRight');
export const Check = createMockIcon('Check');
export const CheckCheck = createMockIcon('CheckCheck');
export const Clock = createMockIcon('Clock');
export const Send = createMockIcon('Send');
export const Search = createMockIcon('Search');
export const MoreVertical = createMockIcon('MoreVertical');
export const Loader2 = createMockIcon('Loader2');
export const Sparkles = createMockIcon('Sparkles');
export const Plus = createMockIcon('Plus');
export const MapPin = createMockIcon('MapPin');
export const Phone = createMockIcon('Phone');
export const User = createMockIcon('User');
export const Bell = createMockIcon('Bell');
export const Download = createMockIcon('Download');
export const Monitor = createMockIcon('Monitor');
export const CheckCircle = createMockIcon('CheckCircle');
export const AlertCircle = createMockIcon('AlertCircle');
export const Palette = createMockIcon('Palette');
export const Shield = createMockIcon('Shield');
export const Eye = createMockIcon('Eye');
export const Filter = createMockIcon('Filter');

// Add any other icons as needed