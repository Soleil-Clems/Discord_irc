import { MimeTypeValidator } from './mime-type.validator';

describe('MimeTypeValidator', () => {
  const validator = new MimeTypeValidator({
    mimeTypes: ['image/png', 'image/jpeg'],
  });

  it('retourne true si le mimetype est autorisé', () => {
    expect(validator.isValid({ mimetype: 'image/png' } as any)).toBe(true);
  });

  it('retourne false si le mimetype est absent', () => {
    expect(validator.isValid({ mimetype: 'application/zip' } as any)).toBe(
      false,
    );
  });

  it('retourne false si aucun fichier', () => {
    expect(validator.isValid()).toBe(false);
  });

  it('buildErrorMessage liste les mimetypes autorisés', () => {
    expect(validator.buildErrorMessage()).toContain('image/png');
    expect(validator.buildErrorMessage()).toContain('image/jpeg');
  });
});
