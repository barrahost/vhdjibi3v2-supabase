// Traduction automatique du navigateur (Google Traduction, traduction de Safari…) : elle remplace les textes de la page
// par ses propres éléments, à l'insu de React. Au rafraîchissement suivant (étape suivante d'un formulaire, envoi…),
// React ne retrouve plus ses textes et s'arrête net : page blanche (« Failed to execute 'removeChild' on 'Node' »).
// La page demande déjà à ne pas être traduite (index.html) ; si un navigateur traduit quand même, ces deux garde-fous
// laissent React continuer au lieu de planter. Contournement connu : https://github.com/facebook/react/issues/11538
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) return child.parentNode.removeChild(child) as T;
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

export {};
