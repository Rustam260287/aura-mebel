{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
  ];
  # Sets environment variables in the workspace
  env = {};
  # Fast way to run sidecar containers in your workspace
  services.firebase.enable = true;
  # Docker image to build your workspace in, it has to have nix in path
  # Be careful, as you can easily create infinite loops here
  #
  # nixpkgs.overlays = [(final: prev: {
  #   # For example, to override package 'some-package' with a consistent version:
  #   some-package = prev.some-package.overrideAttrs (oldAttrs: rec {
  #     src = final.fetchFromGitHub {
  #       owner = "some-owner";
  #       repo = "some-repo";
  #       rev = "some-rev";
  #       hash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  #     };
  #   });
  # })];
  #
  # processes = {
  #   # Example of a process that starts automatically
  #   # web-server = {
  #   #   command = ["python" "-m" "SimpleHTTPServer" "8080"];
  #   #   env = {
  #   #     PORT = "$PORT";
  #   #   };
  #   # };
  # };
}
