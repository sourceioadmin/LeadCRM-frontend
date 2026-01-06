import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AddLeadModal from '../components/AddLeadModal';

const AddLead: React.FC = () => {
  const navigate = useNavigate();
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  useEffect(() => {
    // Show the modal immediately when the page loads
    setShowAddLeadModal(true);
  }, []);

  const handleLeadCreated = () => {
    console.log('Lead created successfully!');
    // Navigate back to dashboard after successful lead creation
    navigate('/');
  };

  const handleModalClose = () => {
    setShowAddLeadModal(false);
    // Navigate back to dashboard when modal is closed
    navigate('/');
  };

  return (
    <Container fluid>
      <Row>
        <Col>
          <h2 className="mb-4">Add New Lead</h2>
          <p className="text-muted">Use the form below to add a new lead to your system.</p>
        </Col>
      </Row>

      {/* Add Lead Modal */}
      <AddLeadModal
        show={showAddLeadModal}
        onHide={handleModalClose}
        onSuccess={handleLeadCreated}
      />
    </Container>
  );
};

export default AddLead;