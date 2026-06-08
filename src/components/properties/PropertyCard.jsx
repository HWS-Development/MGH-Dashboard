import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Globe, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PropertyCard({ property }) {
  const name = property.name?.fr || property.name?.en || 'Sans nom';
  const city = property.city_id?.replace(/_/g, ' ') || '\u2014';
  const imageUrl = property.image_urls?.[0];

  return (
    <Link to={`/properties/${property.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-muted-foreground/8 hover:border-primary/30">
        <div className="relative h-44 bg-muted overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <MapPin className="w-8 h-8" />
            </div>
          )}
          {property.property_type_id && (
            <Badge className="absolute top-3 left-3 bg-primary/80 text-white border-0 text-xs capitalize backdrop-blur-sm">
              {property.property_type_id}
            </Badge>
          )}
          {property.rating_avg > 0 && (
            <div className="absolute top-3 right-3 bg-primary/80 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm">
              <Star className="w-3 h-3 fill-primary text-primary" />
              {property.rating_avg?.toFixed(1)}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors duration-200">{name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="capitalize">{city}</span>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground/60">
            {property.website && (
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-primary/60" />
                <span>Web</span>
              </div>
            )}
            {property.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-primary/60" />
                <span>{property.phone}</span>
              </div>
            )}
            {property.reviews_count > 0 && (
              <span>{property.reviews_count} avis</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
