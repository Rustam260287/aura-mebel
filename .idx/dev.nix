# This is a Nix configuration file.
# It is used to define the environment in which your application is developed, built, and run.
{ pkgs, ... }: {
  # Pinned to a specific version for stability and reproducibility
  channel = "stable-23.11";

  # Add any nix packages you want to be available in your workspace
  # Check https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.firebase-tools
    pkgs.google-cloud-sdk # Добавляем Google Cloud SDK
  ];

  services.firebase.enable = true;
  # Enable this if you want to use the local Firebase emulator
  # services.firebase.emulator.enable = true;


  # Use "nix run" to start the dev server
  scripts.dev.exec = "npm run dev";

  # The following are examples of how to configure your workspace.
  # For more information, see https://www.jetpack.io/devbox/docs/configuration/
  # and https://nixos.org/manual/nixpkgs/stable/
}
