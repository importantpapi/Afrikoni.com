import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';

export default function ErrorState({ 
  message = 'Something went wrong', 
  onRetry = null,
  className = '' 
}) {
  return (
    <Card className={`border-os-accent/20 shadow-os-gold bg-afrikoni-offwhite ${className}`}>
      <CardContent className="p-5 md:p-6 text-center">
        <AlertCircle className="w-12 h-12 text-os-accent mx-auto mb-4" />
        <h3 className="text-os-lg font-semibold text-afrikoni-chestnut mb-2">
          Error
        </h3>
        <p className="text-afrikoni-deep/70 mb-4">
          {message}
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="primary"
            className="min-w-[120px]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

