interface SafariNavigator extends Navigator {
  standalone: boolean;
}

export default function isStandalone() {
  const navigator = window.navigator as SafariNavigator;
  if (navigator && navigator.standalone) {
    return true;
  }
  const clientInformation = window.clientInformation as SafariNavigator;
  if (clientInformation && clientInformation.standalone) {
    return true;
  }
  return false;
}
