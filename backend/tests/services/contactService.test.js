const contactService = require('../../services/contactService');

describe('ContactService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.query.mockClear();
  });

  describe('getAllContacts', () => {
    const mockContacts = [
      {
        id: 'contact-1',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        status: 'active',
        priority: 'high',
        message_count: '5',
        appointment_count: '2'
      },
      {
        id: 'contact-2',
        name: 'Jane Smith',
        phone: '+1234567891',
        email: 'jane@example.com',
        status: 'active',
        priority: 'medium',
        message_count: '3',
        appointment_count: '1'
      }
    ];

    it('should fetch all contacts without filters', async () => {
      mockDb.query.mockResolvedValue({ rows: mockContacts });

      const result = await contactService.getAllContacts();

      expect(result).toEqual(mockContacts);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT c.*'),
        [100, 0]
      );
    });

    it('should fetch contacts with status filter', async () => {
      const activeContacts = [mockContacts[0]];
      mockDb.query.mockResolvedValue({ rows: activeContacts });

      const result = await contactService.getAllContacts({ status: 'active' });

      expect(result).toEqual(activeContacts);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.status = $1'),
        ['active', 100, 0]
      );
    });

    it('should fetch contacts with search filter', async () => {
      mockDb.query.mockResolvedValue({ rows: [mockContacts[0]] });

      const result = await contactService.getAllContacts({ search: 'John' });

      expect(result).toEqual([mockContacts[0]]);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        ['%John%', 100, 0]
      );
    });

    it('should handle pagination', async () => {
      mockDb.query.mockResolvedValue({ rows: mockContacts });

      await contactService.getAllContacts({ limit: 50, offset: 10 });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        [50, 10]
      );
    });
  });

  describe('getContactById', () => {
    const mockContact = {
      id: 'contact-1',
      name: 'John Doe',
      phone: '+1234567890',
      email: 'john@example.com',
      status: 'active',
      priority: 'high',
      message_count: '5',
      appointment_count: '2'
    };

    it('should fetch contact by ID', async () => {
      mockDb.query.mockResolvedValue({ rows: [mockContact] });

      const result = await contactService.getContactById('contact-1');

      expect(result).toEqual(mockContact);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.id = $1'),
        ['contact-1']
      );
    });

    it('should return null for non-existent contact', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await contactService.getContactById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createContact', () => {
    const contactData = {
      name: 'New Contact',
      phone: '+1234567892',
      email: 'new@example.com',
      priority: 'medium',
      notes: 'Test contact',
      status: 'active'
    };

    const createdContact = {
      id: 'new-contact-id',
      ...contactData,
      created_at: new Date()
    };

    it('should create new contact', async () => {
      mockDb.query.mockResolvedValue({ rows: [createdContact] });

      const result = await contactService.createContact(contactData);

      expect(result).toEqual(createdContact);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contacts'),
        [
          contactData.name,
          contactData.phone,
          contactData.email,
          contactData.priority,
          contactData.notes,
          contactData.status
        ]
      );
    });

    it('should use default values for optional fields', async () => {
      const minimalData = {
        name: 'Minimal Contact',
        phone: '+1234567893'
      };

      mockDb.query.mockResolvedValue({ rows: [{ ...minimalData, id: 'id' }] });

      await contactService.createContact(minimalData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contacts'),
        [
          minimalData.name,
          minimalData.phone,
          undefined, // email
          'medium', // default priority
          undefined, // notes
          'active' // default status
        ]
      );
    });
  });

  describe('updateContact', () => {
    const updateData = {
      name: 'Updated Name',
      phone: '+1234567894',
      email: 'updated@example.com',
      priority: 'high',
      notes: 'Updated notes',
      status: 'inactive'
    };

    const updatedContact = {
      id: 'contact-1',
      ...updateData,
      updated_at: new Date()
    };

    it('should update existing contact', async () => {
      mockDb.query.mockResolvedValue({ rows: [updatedContact] });

      const result = await contactService.updateContact('contact-1', updateData);

      expect(result).toEqual(updatedContact);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contacts'),
        [
          updateData.name,
          updateData.phone,
          updateData.email,
          updateData.priority,
          updateData.notes,
          updateData.status,
          'contact-1'
        ]
      );
    });

    it('should return null for non-existent contact', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await contactService.updateContact('non-existent', updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteContact', () => {
    const deletedContact = {
      id: 'contact-1',
      name: 'Deleted Contact'
    };

    it('should delete existing contact', async () => {
      mockDb.query.mockResolvedValue({ rows: [deletedContact] });

      const result = await contactService.deleteContact('contact-1');

      expect(result).toEqual(deletedContact);
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM contacts WHERE id = $1 RETURNING *',
        ['contact-1']
      );
    });

    it('should return null for non-existent contact', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await contactService.deleteContact('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getContactStats', () => {
    const mockStats = {
      total: '10',
      active: '8',
      inactive: '2',
      high_priority: '3',
      medium_priority: '5',
      low_priority: '2'
    };

    it('should fetch contact statistics', async () => {
      mockDb.query.mockResolvedValue({ rows: [mockStats] });

      const result = await contactService.getContactStats();

      expect(result).toEqual(mockStats);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)')
      );
    });
  });
});