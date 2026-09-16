// Example usage of new UI components
import { Button, Input, Modal, Card, CardHeader, CardBody, CardFooter, Alert, Badge } from '@/components/ui';
import { Mail, Lock } from 'lucide-react';

export function ExamplePage() {
  return (
    <div className="space-y-6 p-6">
      {/* Buttons */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Buttons</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="primary">Primaire</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" size="sm">Petit</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      {/* Input */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Input Fields</h2>
        <div className="max-w-xs space-y-4">
          <Input 
            label="Email" 
            placeholder="john@example.com"
            icon={Mail}
            helperText="Nous n'enverrons jamais votre email à des tiers"
          />
          <Input 
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            error="Le mot de passe doit contenir au moins 8 caractères"
          />
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Cards</h2>
        <Card className="max-w-md">
          <CardHeader>
            <h3 className="font-bold text-lg">En-tête de Carte</h3>
          </CardHeader>
          <CardBody>
            <p>Contenu de la carte avec style moderne et ombre subtile.</p>
          </CardBody>
          <CardFooter className="gap-4">
            <Button variant="secondary" size="sm">Annuler</Button>
            <Button size="sm">Valider</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Alerts</h2>
        <div className="max-w-md space-y-3">
          <Alert 
            type="success" 
            title="Succès!" 
            message="L'opération a été effectuée avec succès."
          />
          <Alert 
            type="error" 
            title="Erreur" 
            message="Une erreur s'est produite. Veuillez réessayer."
            closeable
          />
          <Alert 
            type="warning" 
            title="Attention" 
            message="Cette action ne peut pas être annulée."
          />
          <Alert 
            type="info" 
            title="Information" 
            message="Voici quelques informations utiles à connaître."
          />
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Badges</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="success">Actif</Badge>
          <Badge variant="warning">En attente</Badge>
          <Badge variant="danger">Inactif</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="primary">Principal</Badge>
          <Badge variant="success" size="sm">Petit</Badge>
          <Badge variant="success" size="lg">Grand</Badge>
        </div>
      </section>
    </div>
  );
}
