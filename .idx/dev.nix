{ pkgs, ... }:

{
  # Pinned to a specific version for stability and reproducibility
  channel = "stable-23.11";

  # Add any nix packages you want to be available in your workspace
  # Check https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.firebase-tools
  ];
  services.firebase.enable = true;
  # Enable this if you want to use the local Firebase emulator
  # services.firebase.emulator.enable = true;


  # Use "nix run" to start the dev server
  scripts.dev.exec = "npm run dev";

  # The following are some common Nix options that you might want to configure.
  # For a full list of options, see https://nix-dev.Ld/reference/options.html
  #
  # Description of your environment, visible in the IDX dashboard
  # description = "My new environment";

  # This is the star of your environment. It's used to generate a temporary `.nix`
  # file that can be shared with others to easily recreate your environment.
  #
  # # You can leave it as is, or set it to a path to a file in your project.
  # # The file will be copied to the temporary `.nix` file.
  # #
  # # Or you can set it to a string directly. For example:
  # #
  # # startOnCreate = ''
  # #   echo "Welcome to my new environment!"
  # # '';
  #
  # startOnCreate = ./.idx/start.sh;
  #
  # # The name of the file that will be opened by default in the editor
  # # openInEditor = [ "README.md" ];
  #
  # # The commands that will be run when the environment is created
  # # onCreate = [
  # #   "npm install"
  # # ];
  #
  # # The commands that will be run when the environment is started
  # # onStart = [
  # #   "npm run dev"
  # # ];
}
