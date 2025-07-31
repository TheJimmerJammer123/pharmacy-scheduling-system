import React from 'react';
import { Store, MapPin, Phone, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store as StoreType } from '@/types/store';

interface StoreInfoPanelProps {
  store: StoreType | null;
  selectedStore: number;
}

export const StoreInfoPanel: React.FC<StoreInfoPanelProps> = ({
  store,
  selectedStore,
}) => {
  return (
    <div className="h-full p-4">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Store Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {store ? (
            <>
              {/* Store Details */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm">Location</h4>
                  <p className="text-sm text-muted-foreground break-words">
                    <span>{store.city}, {store.state}</span>
                  </p>
                  <p className="text-sm text-muted-foreground break-words">
                    <span className="truncate">{store.address}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span>{store.phone}</span>
                  </p>
                </div>
              </div>

              {/* Store Hours */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm mb-2">Store Hours</h4>
                  <div className="space-y-1 text-xs">
                    {[
                      { day: 'Monday', hours: store.monday_store_hours },
                      { day: 'Tuesday', hours: store.tuesday_store_hours },
                      { day: 'Wednesday', hours: store.wednesday_store_hours },
                      { day: 'Thursday', hours: store.thursday_store_hours },
                      { day: 'Friday', hours: store.friday_store_hours },
                      { day: 'Saturday', hours: store.saturday_store_hours },
                      { day: 'Sunday', hours: store.sunday_store_hours }
                    ].map(({ day, hours }) => (
                      <div key={day} className="flex justify-between">
                        <span className="text-muted-foreground">{day}:</span>
                        <span>{hours || 'Closed'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pharmacy Hours */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm mb-2">Pharmacy Hours</h4>
                  <div className="space-y-1 text-xs">
                    {[
                      { day: 'Monday', hours: store.monday_pharmacy_hours },
                      { day: 'Tuesday', hours: store.tuesday_pharmacy_hours },
                      { day: 'Wednesday', hours: store.wednesday_pharmacy_hours },
                      { day: 'Thursday', hours: store.thursday_pharmacy_hours },
                      { day: 'Friday', hours: store.friday_pharmacy_hours },
                      { day: 'Saturday', hours: store.saturday_pharmacy_hours },
                      { day: 'Sunday', hours: store.sunday_pharmacy_hours }
                    ].map(({ day, hours }) => (
                      <div key={day} className="flex justify-between">
                        <span className="text-muted-foreground">{day}:</span>
                        <span>{hours || 'Closed'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <h4 className="font-medium mb-1">Store Information</h4>
              <p className="text-muted-foreground">Store #{selectedStore} information is loading...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 